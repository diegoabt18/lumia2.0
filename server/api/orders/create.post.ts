import type { H3Event } from 'h3'

import { orderCheckoutShippingSchema } from '#shared/schemas/order-checkout'

import { isSalesDbConfigured } from '../../database/sales'

import { createManualOrder } from '../../core/sales/order.repository'

import { clearCart, getCartItems } from '../../core/sales/cart.repository'

import { findIdempotentOrder, saveIdempotentOrder } from '../../core/sales/order-idempotency'

import { reserveCartStock, releaseCartStockReservations } from '../../core/sales/stock-reservation'

import { resolveCheckoutContext } from '../../utils/cart-context'

import { signOrderAccessToken } from '../../utils/order-access-token'

import { clearGuestCartCookie, getGuestCartKeyFromEvent } from '../../utils/guest-cart-cookie'

import { sendOrderConfirmationEmails } from '../../utils/email'

import { checkRateLimit } from '../../utils/rate-limit'

import { verifyTurnstileToken } from '../../utils/turnstile'

import { quoteStoreShipping } from '../../utils/store-shipping'

import { withServerTimeout } from '../../utils/server-timeout'

import { warmCheckoutMongo } from '../../utils/warm-mongo'

const IDEMPOTENCY_HEADER = 'idempotency-key'
const CHECKOUT_MONGO_TIMEOUT_MS = 25_000

function readIdempotencyKey(event: H3Event): string | null {
  const raw = getHeader(event, IDEMPOTENCY_HEADER) ?? getHeader(event, 'Idempotency-Key')
  const key = raw?.trim()
  if (!key || key.length > 128) return null
  return key
}

function isH3Error(e: unknown): e is { statusCode: number; message?: string } {
  return Boolean(e && typeof e === 'object' && typeof (e as { statusCode?: number }).statusCode === 'number')
}

function mapOrderCreateError(e: unknown): never {
  if (isH3Error(e)) throw e

  const message = e instanceof Error ? e.message : String(e)
  console.error('[api/orders/create POST]', e)

  if (message.includes('timeout')) {
    throw createError({
      statusCode: 503,
      message: 'El pedido tardó demasiado. Pulsa confirmar otra vez (no recargues la página).',
    })
  }

  if (message.includes('E11000') || message.includes('duplicate key')) {
    throw createError({
      statusCode: 503,
      message: 'No se pudo registrar el pedido. Pulsa confirmar otra vez.',
    })
  }

  throw createError({
    statusCode: 500,
    message: 'No se pudo crear el pedido. Inténtalo de nuevo.',
  })
}

function shouldReserveStock(config: ReturnType<typeof useRuntimeConfig>): boolean {
  const raw = config.checkoutReserveStock
  if (raw === false || raw === 0) return false
  if (typeof raw === 'string') return raw !== '0' && raw.toLowerCase() !== 'false'
  return true
}

export default defineEventHandler(async (event) => {
  try {
    if (!isSalesDbConfigured()) {
      throw createError({ statusCode: 503, message: 'Pedidos no disponibles (MongoDB sales)' })
    }

    checkRateLimit(event, 'orders:create', { max: 8, windowMs: 60_000 })

    const body = await readBody(event).catch(() => ({}))
    const parsed = orderCheckoutShippingSchema.safeParse(body)
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        message: 'Datos de envío inválidos',
        data: parsed.error.flatten(),
      })
    }

    const config = useRuntimeConfig()
    const reserveStock = shouldReserveStock(config)

    const [{ subject, session }] = await Promise.all([
      resolveCheckoutContext(event),
      warmCheckoutMongo({ reserveStock, event }),
    ]).then(([ctx]) => [ctx] as const)

    const idempotencyKey = readIdempotencyKey(event)
    if (idempotencyKey) {
      const cached = await findIdempotentOrder(idempotencyKey, subject.cartKey)
      if (cached) return cached
    }

    const turnstileSecret = String(config.turnstileSecretKey || '').trim()
    if (turnstileSecret) {
      const token = parsed.data.turnstileToken?.trim()
      if (!token) {
        throw createError({ statusCode: 400, message: 'Completa la verificación de seguridad antes de confirmar.' })
      }
      const ip = getRequestIP(event, { xForwardedFor: true })
      const verified = await withServerTimeout(
        verifyTurnstileToken(token, turnstileSecret, ip),
        4_000,
        'turnstile verify'
      )
      if (!verified) {
        throw createError({
          statusCode: 403,
          message: 'Verificación de seguridad inválida. Completa el captcha e inténtalo de nuevo.',
        })
      }
    }

    const userId = session?.userId ?? null
    let email: string | null = session?.email?.trim() ?? null

    if (!userId) {
      const guestEmail = parsed.data.email?.trim()
      if (!guestEmail) {
        throw createError({ statusCode: 400, message: 'Indica un email para recibir la confirmación del pedido.' })
      }
      email = guestEmail
    }

    const jwtSecret = config.jwtSecret?.trim()
    if (!jwtSecret) {
      throw createError({ statusCode: 503, message: 'Configuración de seguridad incompleta' })
    }

    const checkoutResult = await withServerTimeout(
      (async () => {
        const items = await getCartItems(subject.cartKey)
        if (!items.length) {
          throw createError({ statusCode: 400, message: 'El carrito está vacío' })
        }

        const reservations = reserveStock ? await reserveCartStock(items, event) : []
        const orderSubtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
        const shippingQuote = quoteStoreShipping(orderSubtotal)

        try {
          const created = await createManualOrder({
            cartItems: items.map((i) => ({
              sku: i.sku,
              productSlug: i.productSlug,
              productName: i.productName,
              variantLabel: i.variantLabel,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              currency: i.currency,
              imagePath: i.imagePath,
            })),
            shipping: parsed.data,
            userId,
            email,
            orderNumberPrefix: String(config.orderNumberPrefix || 'ORD'),
            defaultCurrency: String(config.public.storeCurrency || 'COP'),
            manualPaymentTtlHours: Number(config.orderManualPaymentTtlHours || 72),
            shippingCost: shippingQuote.shippingCost,
            stockReservations: reservations,
          })

          const accessToken = await signOrderAccessToken(created.orderNumber, jwtSecret)
          const response = {
            orderId: created.id,
            orderNumber: created.orderNumber,
            total: created.total,
            currency: created.currency,
            paymentStatus: 'pending_manual' as const,
            paymentMethod: 'manual' as const,
            accessToken,
            instructions:
              'El vendedor se comunicará contigo para coordinar el pago. El pedido quedará en espera de confirmación.',
          }

          await Promise.all([
            clearCart(subject.cartKey),
            idempotencyKey
              ? saveIdempotentOrder(idempotencyKey, subject.cartKey, response).catch((err) => {
                  console.warn('[orders/create] idempotency save failed', (err as Error)?.message)
                })
              : Promise.resolve(),
          ])

          return { cartItems: items, response }
        } catch (e) {
          if (reservations.length) {
            await releaseCartStockReservations(reservations, event).catch((err) => {
              console.warn('[orders/create] release reservations failed', (err as Error)?.message)
            })
          }
          throw e
        }
      })(),
      CHECKOUT_MONGO_TIMEOUT_MS,
      'checkout mongo pipeline'
    )

    if (reserveStock && checkoutResult.response.orderNumber) {
      const { invalidateCatalogCaches } = await import('../../utils/catalog-cache')
      invalidateCatalogCaches()
    }

    if (subject.kind === 'guest' && getGuestCartKeyFromEvent(event)) {
      clearGuestCartCookie(event)
    }

    void sendOrderConfirmationEmails(
      {
        orderNumber: checkoutResult.response.orderNumber,
        customerName: parsed.data.customerName,
        total: checkoutResult.response.total,
        currency: checkoutResult.response.currency,
        phone: parsed.data.phone,
        items: checkoutResult.cartItems.map((i) => ({
          name: i.variantLabel ? `${i.productName} — ${i.variantLabel}` : i.productName,
          quantity: i.quantity,
          subtotal: i.unitPrice * i.quantity,
        })),
        viewOrderUrl: `${String(config.siteUrl || getRequestURL(event).origin).replace(/\/$/, '')}/thank-you?token=${encodeURIComponent(checkoutResult.response.accessToken)}`,
      },
      email
    ).catch((e) => console.warn('[email] order notification failed', (e as Error)?.message))

    return checkoutResult.response
  } catch (e) {
    mapOrderCreateError(e)
  }
})
