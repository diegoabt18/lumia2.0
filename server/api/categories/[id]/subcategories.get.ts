import { lumiaApiFetch } from '../../../utils/lumia-api-client'
import { setPublicCacheHeaders } from '../../../utils/memory-cache'

/** Subcategorías activas de una categoría activa (Server: GET /api/categories/:id/subcategories). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Slug requerido' })

  const data = await lumiaApiFetch<{ subcategories?: unknown[]; items?: unknown[] }>(
    event,
    `/api/categories/${encodeURIComponent(id)}/subcategories`,
  )
  const items = data.items?.length ? data.items : data.subcategories ?? []

  setPublicCacheHeaders(event, 120)
  setHeader(event, 'x-catalog-source', 'api')
  return { items, source: 'api' as const }
})
