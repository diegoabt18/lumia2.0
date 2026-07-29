import { isSalesDbConfigured } from '../../database/sales'
import { clearCart } from '../../core/sales/cart.repository'
import { resolveCartSubjectForWrite } from '../../utils/cart-context'
import { quoteStoreShipping } from '../../utils/store-shipping'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    return { items: [], total: 0, shippingCost: 0, grandTotal: 0, ok: true }
  }

  const subject = await resolveCartSubjectForWrite(event)
  if (!subject) throw createError({ statusCode: 401, message: 'Unauthorized' })

  await clearCart(subject.cartKey)
  const empty = quoteStoreShipping(0)
  return { items: [], subtotal: 0, total: 0, ...empty, ok: true }
})
