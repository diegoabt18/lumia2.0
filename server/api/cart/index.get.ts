import { isSalesDbConfigured } from '../../database/sales'
import { buildCartApiResponse } from '../../core/sales/cart-response'
import { resolveCartSubjectForRead } from '../../utils/cart-context'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    return { items: [], total: 0, source: 'local' as const }
  }
  const subject = await resolveCartSubjectForRead(event)
  if (!subject) return { items: [], total: 0 }
  const cart = await buildCartApiResponse(subject.cartKey)
  return { ...cart, source: 'mongo' as const }
})
