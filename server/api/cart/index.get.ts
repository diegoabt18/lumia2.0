import { isSalesDbConfigured } from '../../database/sales'
import { buildCartApiResponse } from '../../core/sales/cart-response'
import { resolveCartSubjectForRead } from '../../utils/cart-context'
import { withServerTimeout } from '../../utils/server-timeout'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    return { items: [], total: 0, source: 'local' as const }
  }

  try {
    const subject = await resolveCartSubjectForRead(event)
    if (!subject) {
      return { items: [], total: 0, subtotal: 0, shippingCost: 0, grandTotal: 0, shippingVariable: false, freeShipping: false, source: 'local' as const }
    }

    const cart = await withServerTimeout(buildCartApiResponse(subject.cartKey), 5_000, 'cart read')
    return { ...cart, source: 'mongo' as const }
  } catch (e) {
    console.error('[api/cart GET]', e)
    return { items: [], total: 0, subtotal: 0, shippingCost: 0, grandTotal: 0, shippingVariable: false, freeShipping: false, source: 'local' as const }
  }
})
