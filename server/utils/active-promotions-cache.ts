import type { PromotionEntity } from '../core/catalog/domain/promotion'

let cached: { at: number; promos: PromotionEntity[] } | null = null
const TTL_MS = 5 * 60 * 1000

/** Una query Mongo cada ~5 min por instancia Worker — evita N+1 en listados. */
export async function findActivePromotionsCached(): Promise<PromotionEntity[]> {
  const now = Date.now()
  if (cached && now - cached.at < TTL_MS) return cached.promos
  const { findActivePromotions } = await import('../core/catalog/infrastructure/promotion.repository')
  const promos = await findActivePromotions(new Date())
  cached = { at: now, promos }
  return promos
}
