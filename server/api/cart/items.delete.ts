import { isSalesDbConfigured } from '../../database/sales'
import { removeCartItem } from '../../core/sales/cart.repository'
import { resolveCartSubjectForWrite } from '../../utils/cart-context'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Carrito persistente no disponible' })
  }
  const subject = await resolveCartSubjectForWrite(event)
  if (!subject) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody<{ sku?: string }>(event)
  const sku = body?.sku?.trim()
  if (!sku) throw createError({ statusCode: 400, message: 'sku required' })

  await removeCartItem(subject.cartKey, sku)
  return { ok: true }
})
