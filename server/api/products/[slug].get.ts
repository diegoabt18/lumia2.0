import { lumiaApiFetch } from '../../utils/lumia-api-client'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug requerido' })

  const product = await lumiaApiFetch<Record<string, unknown>>(
    event,
    `/api/products/${encodeURIComponent(slug)}`,
  )

  setHeader(event, 'x-catalog-source', 'api')
  return { product, source: 'api' as const }
})
