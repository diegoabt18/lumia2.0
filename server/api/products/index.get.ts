import { lumiaApiFetch } from '../../utils/lumia-api-client'
import { setPublicCacheHeaders } from '../../utils/memory-cache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const search = typeof query.search === 'string' ? query.search : undefined
  const categoryRaw = typeof query.category === 'string' ? query.category.trim() : undefined
  const category = categoryRaw?.split(',')[0]?.trim() || undefined
  const sort = typeof query.sort === 'string' ? query.sort : undefined
  const promo = typeof query.promo === 'string' ? query.promo : undefined
  const slugs = typeof query.slugs === 'string' ? query.slugs : undefined

  const data = await lumiaApiFetch<{
    products?: unknown[]
    items?: unknown[]
    pagination?: { page: number; limit: number; total: number; totalPages: number }
  }>(event, '/api/products', {
    query: { page, limit, search, category, sort, promo, slugs },
  })

  const products = data.products?.length ? data.products : data.items ?? []
  setPublicCacheHeaders(event, 60)
  setHeader(event, 'x-catalog-source', 'api')

  return {
    products,
    items: products,
    pagination: data.pagination,
    source: 'api' as const,
  }
})
