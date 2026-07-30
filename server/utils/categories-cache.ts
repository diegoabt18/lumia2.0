import type { H3Event } from 'h3'
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

export async function getCategoriesCached(event?: H3Event): Promise<CachedCategoryDto[]> {
  return getCached(KEY, TTL_MS, async () => {
    if (event) {
      const { getResolvedCatalogSource } = await import(
        '../core/catalog/application/catalog-reader'
      )
      const source = await getResolvedCatalogSource(event)
      if (source === 'd1') {
        const { listCategoriesForCacheD1 } = await import(
          '../core/catalog/infrastructure/category-d1.repository'
        )
        return listCategoriesForCacheD1(event)
      }
    }

    const { listCategories, countProductsByCategorySlug } = await import(
      '../core/catalog/application/catalog-reader'
    )
    const [categories, counts] = await Promise.all([
      listCategories(event),
      countProductsByCategorySlug(event),
    ])
    return categories.map((c: CategoryRow) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: counts.get(c.slug) ?? 0,
    }))
  })
}
