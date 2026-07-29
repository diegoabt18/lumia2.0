import type { Product } from '#shared/types/product'
import type { PromotionEntity } from '../catalog/domain/promotion'
import { applyPercentToPrice, resolveBestPromotionForProduct } from './promotion-resolution'

export function applyPromotionsToProduct(
  product: Product,
  promotions: PromotionEntity[],
  now: Date = new Date()
): Product {
  const resolved = resolveBestPromotionForProduct(product.slug, product.categorySlug ?? null, promotions, now)
  if (!product.variants?.length) return product

  const variants = product.variants.map((v) => {
    const originalPrice = v.price
    if (!resolved) {
      return {
        ...v,
        originalPrice,
        salePrice: originalPrice,
      }
    }
    return {
      ...v,
      originalPrice,
      salePrice: applyPercentToPrice(originalPrice, resolved.percentOff),
      promotionPercentOff: resolved.percentOff,
      promotionEndsAt: resolved.endsAt.toISOString(),
      promotionLabel: resolved.promotionName,
    }
  })

  const fromPrice = Math.min(...variants.map((x) => x.salePrice ?? x.price))

  return { ...product, variants, fromPrice }
}
