import type { CatalogSort } from '../../core/catalog/catalog-listing'
import { listCatalogProductsCached } from '../../utils/catalog-listing-cache'
import { setCatalogSourceHeader } from '../../utils/catalog-response'
import { setPublicCacheHeaders } from '../../utils/memory-cache'
import { withServerTimeout } from '../../utils/server-timeout'

function parseSort(raw: unknown): CatalogSort {
  if (raw === 'name-asc' || raw === 'price-asc' || raw === 'price-desc') return raw
  return 'featured'
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const skip = (page - 1) * limit
  const search = typeof query.search === 'string' ? query.search : undefined
  const categoryRaw = typeof query.category === 'string' ? query.category.trim() : undefined
  const categorySlug = categoryRaw?.split(',')[0]?.trim() || undefined
  const categorySlugs = categorySlug ? [categorySlug] : undefined
  const slugsRaw = typeof query.slugs === 'string' ? query.slugs : undefined
  const productSlugs = slugsRaw
    ? slugsRaw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30)
    : undefined
  const promoOnly = query.promo === '1' || query.promo === 'true'
  const sort = parseSort(query.sort)

  try {
    const { products, total } = await withServerTimeout(
      listCatalogProductsCached(
        {
          limit,
          skip,
          search,
          categorySlugs,
          productSlugs,
          promoOnly,
          sort,
        },
        event
      ),
      15_000,
      'catalog list'
    )
    const totalPages = Math.max(1, Math.ceil(total / limit))

    const cacheSeconds =
      promoOnly || sort !== 'featured' ? 30 : search || categorySlugs?.length ? 45 : 90
    setPublicCacheHeaders(event, cacheSeconds)

    const source = await setCatalogSourceHeader(event)
    return {
      products,
      items: products,
      pagination: { page, limit, total, totalPages },
      source,
    }
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    if (err.statusCode === 503) {
      throw createError({ statusCode: 503, message: err.message ?? 'Catálogo no disponible' })
    }
    console.error('[api/products]', e)
    throw createError({
      statusCode: 503,
      message: 'El catálogo tardó demasiado. Inténtalo de nuevo.',
    })
  }
})
