import { lumiaApiFetch } from '../../utils/lumia-api-client'
import { setPublicCacheHeaders } from '../../utils/memory-cache'

export default defineEventHandler(async (event) => {
  const data = await lumiaApiFetch<{ categories?: unknown[]; items?: unknown[] }>(event, '/api/categories')
  const categories = data.categories?.length ? data.categories : data.items ?? []

  setPublicCacheHeaders(event, 120)
  setHeader(event, 'x-catalog-source', 'api')
  return { categories, items: categories, source: 'api' as const }
})
