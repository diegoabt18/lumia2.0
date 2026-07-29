import type { PromotionEntity } from '../catalog/domain/promotion'
import {
  applyPercentToPrice,
  resolveBestPromotionForProduct as resolveBestUnified,
  type ResolvedPromotion,
} from '#shared/pricing/promotion-discount'
import { promotionEntitiesToUnifiedRules } from './promotion-mapper'

export type { ResolvedPromotion }
export { applyPercentToPrice }

export function resolveBestPromotionForProduct(
  productSlug: string,
  categorySlug: string | undefined | null,
  promotions: PromotionEntity[],
  now: Date
): ResolvedPromotion | null {
  const rules = promotionEntitiesToUnifiedRules(promotions)
  return resolveBestUnified(productSlug, categorySlug, rules, now)
}
