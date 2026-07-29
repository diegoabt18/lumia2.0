import { orderCheckoutShippingSchema } from '#shared/schemas/order-checkout'
import { isSalesDbConfigured } from '../../database/sales'
import { getUserById } from '../../database/auth'
import { createManualOrder } from '../../core/sales/order.repository'
import { clearCart, getCartItems } from '../../core/sales/cart.repository'
import { resolveCartSubjectForWrite } from '../../utils/cart-context'
import { getSessionFromEvent } from '../../utils/session'
import { clearGuestCartCookie, getGuestCartKeyFromEvent } from '../../utils/guest-cart-cookie'
import { sendOrderConfirmationEmails } from '../../utils/email'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Pedidos no disponibles (MongoDB sales)' })
  }

  const body = await readBody(event).catch(() => ({}))
  const parsed = orderCheckoutShippingSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Datos de envío inválidos',
      data: parsed.error.flatten(),
    })
  }

  const subject = await resolveCartSubjectForWrite(event)
  if (!subject) throw createError({ statusCode: 401, message: 'No se pudo identificar el carrito' })

  const cartItems = await getCartItems(subject.cartKey)
  if (!cartItems.length) {
    throw createError({ statusCode: 400, message: 'El carrito está vacío' })
  }

  const session = await getSessionFromEvent(event)
  let email: string | null = session?.email ?? null
  const userId = session?.userId ?? null

  if (userId && !email) {
    try {
      const user = await getUserById(userId)
      email = user?.email ?? null
    } catch {
      /* auth db opcional para email */
    }
  }

  const config = useRuntimeConfig()
  const result = await createManualOrder({
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
  })

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
    },
    email
  ).catch((e) => console.warn('[email] order notification failed', (e as Error)?.message))

  return {
    orderId: result.id,
    orderNumber: result.orderNumber,
    total: result.total,
    currency: result.currency,
    paymentStatus: 'pending_manual',
    paymentMethod: 'manual',
    instructions:
      'El vendedor se comunicará contigo para coordinar el pago. El pedido quedará en espera de confirmación.',
  }
})
