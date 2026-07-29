import type { CategoryRow } from '../core/catalog/infrastructure/category.repository'
import { getCached } from './memory-cache'

const TTL_MS = 15 * 60 * 1000
const KEY = 'catalog:categories-v1'

export type CachedCategoryDto = {
  id: string
  name: string
  slug: string
  productCount: number
}

export async function getCategoriesCached(): Promise<CachedCategoryDto[]> {
  return getCached(KEY, TTL_MS, async () => {
    const { listCategories, countProductsByCategorySlug } = await import(
      '../core/catalog/infrastructure/category.repository'
    )
    const [categories, counts] = await Promise.all([listCategories(), countProductsByCategorySlug()])
    return categories.map((c: CategoryRow) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: counts.get(c.slug) ?? 0,
    }))
  })
}
