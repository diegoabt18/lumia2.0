import { listProducts, countProducts } from '../../core/catalog/infrastructure/product.repository'

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

  try {
    const [products, total] = await Promise.all([
      listProducts({ limit, skip, search, categorySlugs }),
      countProducts(search, categorySlugs),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

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
