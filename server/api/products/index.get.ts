import { listCatalogProducts, type CatalogSort } from '../../core/catalog/catalog-listing'
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
  const categoryRaw = typeof query.category === 'string' ? query.category : undefined
  const categorySlugs = categoryRaw
    ? categoryRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined
  const slugsRaw = typeof query.slugs === 'string' ? query.slugs : undefined
  const productSlugs = slugsRaw
    ? slugsRaw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30)
    : undefined
  const promoOnly = query.promo === '1' || query.promo === 'true'
  const sort = parseSort(query.sort)

  try {
    const { products, total } = await withServerTimeout(
      listCatalogProducts({
        limit,
        skip,
        search,
        categorySlugs,
        productSlugs,
        promoOnly,
        sort,
      }),
      8000,
      'catalog list'
    )
    const totalPages = Math.max(1, Math.ceil(total / limit))

    setPublicCacheHeaders(event, promoOnly || sort !== 'featured' ? 15 : 45)

    return {
      products,
      items: products,
      pagination: { page, limit, total, totalPages },
      source: 'mongodb' as const,
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
