import type { H3Event } from 'h3'

import { orderCheckoutShippingSchema } from '#shared/schemas/order-checkout'

import { isSalesDbConfigured } from '../../database/sales'

import { getUserById } from '../../database/auth'

import { createManualOrder } from '../../core/sales/order.repository'

import { clearCart, getCartItems } from '../../core/sales/cart.repository'

import { findIdempotentOrder, saveIdempotentOrder } from '../../core/sales/order-idempotency'

import { reserveCartStock, releaseCartStockReservations } from '../../core/sales/stock-reservation'

import { resolveCartSubjectForWrite } from '../../utils/cart-context'

import { getSessionFromEvent } from '../../utils/session'

import { signOrderAccessToken } from '../../utils/order-access-token'

import { clearGuestCartCookie, getGuestCartKeyFromEvent } from '../../utils/guest-cart-cookie'

import { sendOrderConfirmationEmails } from '../../utils/email'

import { checkRateLimit } from '../../utils/rate-limit'

import { verifyTurnstileToken } from '../../utils/turnstile'

import { quoteStoreShipping } from '../../utils/store-shipping'

import { withServerTimeout } from '../../utils/server-timeout'

import { warmCheckoutMongo } from '../../utils/warm-mongo'

const IDEMPOTENCY_HEADER = 'idempotency-key'
/** Checkout: varias bases Mongo en una sola petición (carrito + stock + orden). */
const CHECKOUT_MONGO_TIMEOUT_MS = 30_000

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
      message: 'El pedido tardó demasiado. Inténtalo de nuevo en unos segundos.',
    })
  }

  if (message.includes('E11000') || message.includes('duplicate key')) {
    throw createError({
      statusCode: 503,
      message: 'No se pudo registrar el pedido. Inténtalo de nuevo.',
    })
  }

  throw createError({
    statusCode: 500,
    message: 'No se pudo crear el pedido. Inténtalo de nuevo.',
  })
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
    const turnstileSecret = String(config.turnstileSecretKey || '').trim()
    if (turnstileSecret) {
      const token = parsed.data.turnstileToken?.trim()
      if (!token) {
        throw createError({ statusCode: 400, message: 'Completa la verificación de seguridad antes de confirmar.' })
      }
      const ip = getRequestIP(event, { xForwardedFor: true })
      const verified = await withServerTimeout(
        verifyTurnstileToken(token, turnstileSecret, ip),
        5_000,
        'turnstile verify'
      )
      if (!verified) {
        throw createError({
          statusCode: 403,
          message: 'Verificación de seguridad inválida. Recarga e inténtalo de nuevo.',
        })
      }
    }

    await warmCheckoutMongo()

    const subject = await resolveCartSubjectForWrite(event)
    if (!subject) throw createError({ statusCode: 401, message: 'No se pudo identificar el carrito' })

    const idempotencyKey = readIdempotencyKey(event)
    if (idempotencyKey) {
      const cached = await withServerTimeout(
        findIdempotentOrder(idempotencyKey, subject.cartKey),
        6_000,
        'order idempotency read'
      )
      if (cached) return cached
    }

    const session = await getSessionFromEvent(event)
    let email: string | null = session?.email?.trim() ?? null
    const userId = session?.userId ?? null

    if (userId && !email) {
      try {
        const user = await withServerTimeout(getUserById(userId), 5_000, 'order user email')
        email = user?.email?.trim() ?? null
      } catch {
        /* auth db opcional para email */
      }
    }

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

    // Precios del carrito persistido; reserva de stock valida disponibilidad atómicamente.
    const { cartItems, stockReservations, result } = await withServerTimeout(
      (async () => {
        const items = await getCartItems(subject.cartKey)
        if (!items.length) {
          throw createError({ statusCode: 400, message: 'El carrito está vacío' })
        }

        const reservations = await reserveCartStock(items)
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
          return { cartItems: items, stockReservations: reservations, result: created }
        } catch (e) {
          await releaseCartStockReservations(reservations).catch((err) => {
            console.warn('[orders/create] release reservations failed', (err as Error)?.message)
          })
          throw e
        }
      })(),
      CHECKOUT_MONGO_TIMEOUT_MS,
      'checkout mongo pipeline'
    )

    const accessToken = await signOrderAccessToken(result.orderNumber, jwtSecret)
    const siteOrigin = String(config.siteUrl || getRequestURL(event).origin).replace(/\/$/, '')
    const viewOrderUrl = `${siteOrigin}/thank-you?token=${encodeURIComponent(accessToken)}`

    try {
      await clearCart(subject.cartKey)
      if (subject.kind === 'guest' && getGuestCartKeyFromEvent(event)) {
        clearGuestCartCookie(event)
      }
    } catch {
      /* no crítico */
    }

    void sendOrderConfirmationEmails(
      {
        orderNumber: result.orderNumber,
        customerName: parsed.data.customerName,
        total: result.total,
        currency: result.currency,
        phone: parsed.data.phone,
        items: cartItems.map((i) => ({
          name: i.variantLabel ? `${i.productName} — ${i.variantLabel}` : i.productName,
          quantity: i.quantity,
          subtotal: i.unitPrice * i.quantity,
        })),
        viewOrderUrl,
      },
      email
    ).catch((e) => console.warn('[email] order notification failed', (e as Error)?.message))

    const response = {
      orderId: result.id,
      orderNumber: result.orderNumber,
      total: result.total,
      currency: result.currency,
      paymentStatus: 'pending_manual' as const,
      paymentMethod: 'manual' as const,
      accessToken,
      instructions:
        'El vendedor se comunicará contigo para coordinar el pago. El pedido quedará en espera de confirmación.',
    }

    if (idempotencyKey) {
      const saved = await withServerTimeout(
        saveIdempotentOrder(idempotencyKey, subject.cartKey, response),
        6_000,
        'order idempotency save'
      )
      if (!saved) {
        const cached = await withServerTimeout(
          findIdempotentOrder(idempotencyKey, subject.cartKey),
          6_000,
          'order idempotency read'
        )
        if (cached) return cached
      }
    }

    return response
  } catch (e) {
    mapOrderCreateError(e)
  }
})
