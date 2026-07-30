import type { H3Event } from 'h3'

import { orderCheckoutShippingSchema } from '#shared/schemas/order-checkout'

import { isSalesDbConfigured } from '../../database/sales'

import { isCatalogDbConfigured } from '../../database/catalog'

import { getUserById } from '../../database/auth'

import { createManualOrder } from '../../core/sales/order.repository'

import { clearCart, getCartItems } from '../../core/sales/cart.repository'

import { enrichCartItems } from '../../core/sales/enrich-cart-prices'

import { findIdempotentOrder, saveIdempotentOrder } from '../../core/sales/order-idempotency'

import { validateCartStock } from '../../core/sales/validate-cart-stock'

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

const IDEMPOTENCY_HEADER = 'idempotency-key'

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
      const verified = await verifyTurnstileToken(token, turnstileSecret, ip)
      if (!verified) {
        throw createError({
          statusCode: 403,
          message: 'Verificación de seguridad inválida. Recarga e inténtalo de nuevo.',
        })
      }
    }

    const subject = await resolveCartSubjectForWrite(event)
    if (!subject) throw createError({ statusCode: 401, message: 'No se pudo identificar el carrito' })

    const idempotencyKey = readIdempotencyKey(event)
    if (idempotencyKey) {
      const cached = await withServerTimeout(
        findIdempotentOrder(idempotencyKey, subject.cartKey),
        5_000,
        'order idempotency read'
      )
      if (cached) return cached
    }

    const rawCartItems = await withServerTimeout(getCartItems(subject.cartKey), 8_000, 'cart read for order')
    if (!rawCartItems.length) {
      throw createError({ statusCode: 400, message: 'El carrito está vacío' })
    }

    let cartItems = rawCartItems
    if (isCatalogDbConfigured()) {
      try {
        cartItems = (
          await withServerTimeout(enrichCartItems(rawCartItems), 8_000, 'cart price enrich')
        ).items
      } catch (e) {
        console.warn('[orders/create] enrich prices failed', (e as Error)?.message)
      }
    }

    const stockCheck = await withServerTimeout(validateCartStock(cartItems), 8_000, 'cart stock validation')
    if (!stockCheck.ok) {
      const first = stockCheck.issues[0]
      const detail =
        stockCheck.issues.length === 1 && first
          ? `${first.productName}: solo hay ${first.available} disponible(s).`
          : 'Algunos productos ya no tienen stock suficiente. Revisa tu carrito.'
      throw createError({ statusCode: 409, message: detail, data: { stockIssues: stockCheck.issues } })
    }

    const session = await getSessionFromEvent(event)
    let email: string | null = session?.email?.trim() ?? null
    const userId = session?.userId ?? null

    if (userId && !email) {
      try {
        const user = await getUserById(userId)
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

    const stockReservations = await withServerTimeout(reserveCartStock(cartItems), 10_000, 'cart stock reserve')
    const orderSubtotal = cartItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    const shippingQuote = quoteStoreShipping(orderSubtotal)

    let result: Awaited<ReturnType<typeof createManualOrder>>
    try {
      result = await withServerTimeout(
        createManualOrder({
          cartItems: cartItems.map((i) => ({
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
          stockReservations,
        }),
        10_000,
        'order insert'
      )
    } catch (e) {
      await releaseCartStockReservations(stockReservations).catch((err) => {
        console.warn('[orders/create] release reservations failed', (err as Error)?.message)
      })
      throw e
    }

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
        5_000,
        'order idempotency save'
      )
      if (!saved) {
        const cached = await withServerTimeout(
          findIdempotentOrder(idempotencyKey, subject.cartKey),
          5_000,
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
