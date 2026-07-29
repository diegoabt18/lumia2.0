import { listProductFeedbackReadOnly } from '../../../core/feedback/list-product-feedback'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug requerido' })

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(20, Math.max(1, Number(query.limit) || 8))

  try {
    return await listProductFeedbackReadOnly(slug, page, limit)
  } catch (e) {
    console.error('[api/products/feedback]', e)
    throw createError({ statusCode: 503, message: 'Reseñas no disponibles' })
  }
})
