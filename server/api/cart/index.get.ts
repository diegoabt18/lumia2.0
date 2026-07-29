import { isSalesDbConfigured } from '../../database/sales'
import { cartResponse, getCartItems } from '../../core/sales/cart.repository'
import { resolveCartSubjectForRead } from '../../utils/cart-context'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    return { items: [], total: 0, source: 'local' as const }
  }
  const subject = await resolveCartSubjectForRead(event)
  if (!subject) return { items: [], total: 0 }
  const items = await getCartItems(subject.cartKey)
  return { ...cartResponse(items), source: 'mongo' as const }
})
