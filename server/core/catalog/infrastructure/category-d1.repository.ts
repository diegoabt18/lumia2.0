import type { H3Event } from 'h3'
import type { CachedCategoryDto } from '../../../utils/categories-cache'
import type { CategoryRow } from './category.repository'
import type { CatalogD1DatabaseSession } from '../../../database/catalog-d1'
import { getCatalogReadSession, persistCatalogBookmark } from './d1-session'

interface CategoryD1Row {
  slug: string
  name: string
  product_count: number
}

export async function listCategoriesD1(event: H3Event): Promise<CategoryRow[]> {
  const session = getCatalogReadSession(event)
  const { results } = await session
    .prepare(`SELECT slug, name, product_count FROM categories ORDER BY name ASC`)
    .all<CategoryD1Row>()

  persistCatalogBookmark(event, session)
  return results.map((row) => ({
    id: row.slug,
    name: row.name,
    slug: row.slug,
  }))
}

/** Una sola lectura D1: categorías + conteos denormalizados (evita queries paralelas). */
export async function listCategoriesForCacheD1(event: H3Event): Promise<CachedCategoryDto[]> {
  const session = getCatalogReadSession(event)
  const { results } = await session
    .prepare(`SELECT slug, name, product_count FROM categories ORDER BY name ASC`)
    .all<CategoryD1Row>()

  persistCatalogBookmark(event, session)
  return results.map((row) => ({
    id: row.slug,
    name: row.name,
    slug: row.slug,
    productCount: row.product_count ?? 0,
  }))
}

export async function countProductsByCategorySlugD1(event: H3Event): Promise<Map<string, number>> {
  const session = getCatalogReadSession(event)
  const { results } = await session
    .prepare(
      `SELECT category_slug AS slug, COUNT(*) AS n
       FROM products
       WHERE status != 'inactive' AND category_slug IS NOT NULL AND category_slug != ''
       GROUP BY category_slug`
    )
    .all<{ slug: string; n: number }>()

  persistCatalogBookmark(event, session)
  const map = new Map<string, number>()
  for (const row of results) {
    if (row.slug) map.set(row.slug, row.n)
  }
  return map
}

export async function loadTopSellingSlugsOnSession(
  session: CatalogD1DatabaseSession,
  limit: number
): Promise<string[]> {
  const safeLimit = Math.max(1, Math.min(limit, 20))
  const { results } = await session
    .prepare(
      `SELECT slug FROM products
       WHERE status != 'inactive'
       ORDER BY sales_total_units DESC, slug ASC
       LIMIT ?`
    )
    .bind(safeLimit)
    .all<{ slug: string }>()

  return results.map((r) => r.slug).filter(Boolean)
}

export async function findTopSellingSlugsD1(event: H3Event, limit: number): Promise<string[]> {
  const session = getCatalogReadSession(event)
  const slugs = await loadTopSellingSlugsOnSession(session, limit)
  persistCatalogBookmark(event, session)
  return slugs
}
