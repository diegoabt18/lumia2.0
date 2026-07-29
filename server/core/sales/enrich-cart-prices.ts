import type { CartItem } from '#shared/types/product'
import { getCatalogDb } from '../../database/catalog'
import type { ProductDoc, VariantDoc } from '../catalog/infrastructure/product.repository'
import { findActivePromotionsCached } from '../../utils/active-promotions-cache'
import { applyPercentToPrice, resolveBestPromotionForProduct } from '../pricing/promotion-resolution'

export type EnrichedCartItem = CartItem & {
  originalUnitPrice?: number
  promotionPercentOff?: number
  promotionLabel?: string
}

/** Recalcula precios con promos activas (misma lógica que PDP/catálogo). */
export async function enrichCartItems(items: CartItem[]): Promise<{ items: EnrichedCartItem[]; total: number }> {
  if (!items.length) return { items: [], total: 0 }

  const skus = [...new Set(items.map((i) => i.sku))]
  const db = await getCatalogDb()
  const variants = await db.collection<VariantDoc>('variants').find({ sku: { $in: skus } }).toArray()
  const variantBySku = new Map(variants.map((v) => [v.sku, v]))

  const slugSet = new Set<string>()
  for (const item of items) {
    const v = variantBySku.get(item.sku)
    slugSet.add(v?.product_slug ?? item.productSlug)
  }

  const productRows = await db
    .collection<ProductDoc>('products')
    .find({ slug: { $in: [...slugSet] } }, { projection: { slug: 1, category_slug: 1 } })
    .toArray()
  const categoryBySlug = new Map(productRows.map((p) => [p.slug, p.category_slug ?? null]))

  const promos = await findActivePromotionsCached()
  const now = new Date()

  let total = 0
  const out: EnrichedCartItem[] = []

  for (const item of items) {
    const variant = variantBySku.get(item.sku)
    const slug = variant?.product_slug ?? item.productSlug
    if (!variant || !slug) {
      total += item.unitPrice * item.quantity
      out.push({ ...item })
      continue
    }

    const categorySlug = categoryBySlug.get(slug) ?? null
    const resolved = resolveBestPromotionForProduct(slug, categorySlug, promos, now)
    const base = variant.price
    const unitPrice = resolved ? applyPercentToPrice(base, resolved.percentOff) : base
    total += unitPrice * item.quantity

    out.push({
      ...item,
      unitPrice,
      originalUnitPrice: resolved && unitPrice < base ? base : undefined,
      promotionPercentOff: resolved?.percentOff,
      promotionLabel: resolved?.promotionName,
    })
  }

  return { items: out, total }
}
