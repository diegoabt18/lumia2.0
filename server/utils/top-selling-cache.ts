import { getCached } from './memory-cache'

const TTL_MS = 10 * 60 * 1000
const KEY = 'catalog:top-selling-slugs'

export async function findTopSellingSlugsCached(limit: number): Promise<string[]> {
  const safeLimit = Math.max(1, Math.min(limit, 20))
  return getCached(`${KEY}:${safeLimit}`, TTL_MS, async () => {
    const { getCatalogDb } = await import('../database/catalog')
    const db = await getCatalogDb()
    const rows = await db
      .collection('products')
      .find({ status: { $ne: 'inactive' } })
      .sort({ sales_total_units: -1 })
      .limit(safeLimit)
      .project({ slug: 1 })
      .toArray()
    return rows.map((r) => r.slug).filter(Boolean) as string[]
  })
}
