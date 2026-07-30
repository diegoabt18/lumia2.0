import { isSalesDbConfigured } from '../../../database/sales'
import {
  listProductFeedbackReadOnly,
  type ProductFeedbackResult,
} from '../../../core/feedback/list-product-feedback'
import { withServerTimeout } from '../../../utils/server-timeout'

function emptyFeedback(page: number, limit: number): ProductFeedbackResult {
  return {
    rating: {
      average: 0,
      count: 0,
      distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 })),
    },
    reviews: [],
    pagination: { page, limit, total: 0, pages: 1 },
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug requerido' })

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(20, Math.max(1, Number(query.limit) || 8))

  if (!isSalesDbConfigured()) {
    return emptyFeedback(page, limit)
  }

  try {
    return await withServerTimeout(
      listProductFeedbackReadOnly(slug, page, limit),
      5_000,
      'product feedback list'
    )
  } catch (e) {
    console.warn('[api/products/feedback GET]', (e as Error)?.message ?? e)
    return emptyFeedback(page, limit)
  }
})
