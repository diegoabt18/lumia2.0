import { lumiaApiFetch } from '../../utils/lumia-api-client'
import { setPublicCacheHeaders } from '../../utils/memory-cache'

/** Categoría activa con sus subcategorías activas (Server: GET /api/categories/:id). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Slug requerido' })

  const category = await lumiaApiFetch<Record<string, unknown>>(
    event,
    `/api/categories/${encodeURIComponent(id)}`,
  )

  setPublicCacheHeaders(event, 120)
  setHeader(event, 'x-catalog-source', 'api')
  return { category, source: 'api' as const }
})
