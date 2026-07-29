import { listProductsPage } from '../../core/catalog/infrastructure/product.repository'
import { setPublicCacheHeaders } from '../../utils/memory-cache'

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

  try {
    const { products, total } = await listProductsPage({ limit, skip, search, categorySlugs, productSlugs })
    const totalPages = Math.max(1, Math.ceil(total / limit))

    setPublicCacheHeaders(event, 45)

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
    throw createError({ statusCode: 500, message: 'Error al cargar productos' })
  }
})
