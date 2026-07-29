import type { PromotionEntity } from '../domain/promotion'

export async function findActivePromotions(at: Date): Promise<PromotionEntity[]> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const db = await getCatalogDb()
  return db
    .collection<PromotionEntity>('promotions')
    .find({
      active: true,
      starts_at: { $lte: at },
      ends_at: { $gte: at },
    })
    .sort({ priority: 1 })
    .toArray()
}
