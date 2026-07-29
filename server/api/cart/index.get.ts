import { isSalesDbConfigured } from '../../database/sales'
import { getCartItems } from '../../core/sales/cart.repository'
import { enrichCartItems } from '../../core/sales/enrich-cart-prices'
import { resolveCartSubjectForRead } from '../../utils/cart-context'
import { isCatalogDbConfigured } from '../../database/catalog'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    return { items: [], total: 0, source: 'local' as const }
  }
  const subject = await resolveCartSubjectForRead(event)
  if (!subject) return { items: [], total: 0 }
  const items = await getCartItems(subject.cartKey)
  if (!items.length) return { items: [], total: 0, source: 'mongo' as const }
  if (isCatalogDbConfigured()) {
    try {
      const enriched = await enrichCartItems(items)
      return { ...enriched, source: 'mongo' as const }
    } catch (e) {
      console.warn('[cart] enrich prices failed', (e as Error)?.message)
    }
  }
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  return { items, total, source: 'mongo' as const }
})
