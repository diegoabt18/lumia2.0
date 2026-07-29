import { isSalesDbConfigured } from '../../database/sales'
import { setCartLineQuantity } from '../../core/sales/cart.repository'
import { resolveCartSubjectForWrite } from '../../utils/cart-context'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Carrito persistente no disponible' })
  }
  const subject = await resolveCartSubjectForWrite(event)
  if (!subject) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody<{ sku?: string; quantity?: number }>(event)
  const sku = body?.sku?.trim()
  const quantity = body?.quantity
  if (!sku || typeof quantity !== 'number') {
    throw createError({ statusCode: 400, message: 'sku and quantity required' })
  }

  await setCartLineQuantity(subject.cartKey, sku, quantity)
  return { ok: true }
})
