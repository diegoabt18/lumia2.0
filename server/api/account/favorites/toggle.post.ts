import { isSalesDbConfigured } from '../../../database/sales'
import { createFavoritesRepository } from '../../../core/sales/favorites.repository'
import { getSessionFromEvent } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSessionFromEvent(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Inicia sesión para guardar favoritos' })
  }
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Favoritos no disponibles' })
  }

  const body = await readBody(event).catch(() => ({})) as { productSlug?: string }
  const slug = body?.productSlug?.trim()
  if (!slug) throw createError({ statusCode: 400, message: 'productSlug requerido' })

  const repo = createFavoritesRepository()
  const exists = await repo.has(session.userId, slug)
  if (exists) {
    await repo.remove(session.userId, slug)
    return { ok: true, favorited: false }
  }
  try {
    await repo.add(session.userId, slug)
    return { ok: true, favorited: true }
  } catch (e: unknown) {
    if ((e as Error)?.message === 'FAVORITES_LIMIT') {
      throw createError({ statusCode: 400, message: 'Máximo 30 favoritos. Elimina uno para añadir otro.' })
    }
    throw e
  }
})
