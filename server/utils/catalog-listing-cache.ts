import type { H3Event } from 'h3'
import type { Product } from '#shared/types/product'
import { listCatalogProducts, type CatalogSort } from '../core/catalog/catalog-listing'
import { getCached } from './memory-cache'

const TTL_DEFAULT_MS = 90_000
const TTL_FILTERED_MS = 120_000
const TTL_HEAVY_MS = 45_000

function listingCacheKey(options: {
  limit: number
  skip: number
  search?: string
  categorySlugs?: string[]
  productSlugs?: string[]
  promoOnly?: boolean
  sort?: CatalogSort
}): string {  const sort = options.sort ?? 'featured'
  const categories = [...(options.categorySlugs ?? [])].sort().join(',')
  const slugs = [...(options.productSlugs ?? [])].sort().join(',')
  return [
    'catalog:v2',
    options.limit,
    options.skip,
    options.search?.trim() ?? '',
    categories,
    slugs,
    options.promoOnly ? '1' : '0',
    sort,
  ].join('|')
}

function listingTtlMs(options: {
  search?: string
  categorySlugs?: string[]
  promoOnly?: boolean
  sort?: CatalogSort
}): number {
  const sort = options.sort ?? 'featured'
  const needsPostProcess = Boolean(options.promoOnly) || sort !== 'featured'
  if (needsPostProcess) return TTL_HEAVY_MS
  if (options.search?.trim() || options.categorySlugs?.length) return TTL_FILTERED_MS
  return TTL_DEFAULT_MS
}

export async function listCatalogProductsCached(
  options: {
    limit: number
    skip: number
    search?: string
    categorySlugs?: string[]
    productSlugs?: string[]
    promoOnly?: boolean
    sort?: CatalogSort
  },
  event?: H3Event
): Promise<{ products: Product[]; total: number }> {
  const key = listingCacheKey(options)
  const ttlMs = listingTtlMs(options)
  return getCached(key, ttlMs, () => listCatalogProducts(options, event))
}