import { isSalesDbConfigured } from '../../database/sales'
import { addCartItem } from '../../core/sales/cart.repository'
import { getVariantBySku } from '../../core/catalog/infrastructure/product.repository'
import { resolveCartSubjectForWrite } from '../../utils/cart-context'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Carrito persistente no disponible (MongoDB sales)' })
  }
  const subject = await resolveCartSubjectForWrite(event)
  if (!subject) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody<{ sku?: string; quantity?: number }>(event)
  const sku = body?.sku?.trim()
  const quantity = Math.max(1, body?.quantity ?? 1)
  if (!sku) throw createError({ statusCode: 400, message: 'sku required' })

  const variant = await getVariantBySku(sku)
  if (!variant) throw createError({ statusCode: 404, message: 'Variant not found' })

  const available = variant.available ?? variant.stock ?? 99
  if (available <= 0) throw createError({ statusCode: 409, message: 'Sin stock' })

  const finalQty = Math.min(quantity, available)

  await addCartItem(subject.cartKey, {
    sku: variant.sku,
    productSlug: variant.product_slug,
    productName: variant.product_name ?? variant.sku,
    quantity: finalQty,
    unitPrice: variant.price,
    currency: variant.currency ?? 'COP',
    imagePath: variant.image_path ?? null,
  })

  return { ok: true }
})
