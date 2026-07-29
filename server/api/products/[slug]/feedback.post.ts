import { productReviewSubmitSchema } from '#shared/schemas/product-review'
import { isSalesDbConfigured } from '../../../database/sales'
import { upsertProductReview } from '../../../core/feedback/upsert-product-review'
import { getSessionFromEvent } from '../../../utils/session'
import { checkRateLimit } from '../../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Reseñas no disponibles' })
  }

  const session = await getSessionFromEvent(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Inicia sesión para dejar una reseña' })
  }

  checkRateLimit(event, 'feedback:review', { max: 5, windowMs: 60_000, keySuffix: session.userId })

  const slug = getRouterParam(event, 'slug')?.trim()
  if (!slug) throw createError({ statusCode: 400, message: 'Producto inválido' })

  const body = await readBody(event).catch(() => ({}))
  const parsed = productReviewSubmitSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.errors[0]?.message ?? 'Reseña inválida',
    })
  }

  const userName = session.name?.trim() || session.email?.split('@')[0] || `Usuario ${session.userId.slice(-6)}`

  await upsertProductReview({
    productSlug: slug,
    userId: session.userId,
    userName,
    userAvatar: session.avatar,
    stars: parsed.data.stars,
    title: parsed.data.title,
    body: parsed.data.body,
  })

  return { ok: true }
})
