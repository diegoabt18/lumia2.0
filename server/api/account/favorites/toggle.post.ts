import { isSalesDbConfigured } from '../../../database/sales'
import { createFavoritesRepository } from '../../../core/sales/favorites.repository'
import { getSessionFromEvent } from '../../../utils/session'
import { withServerTimeout } from '../../../utils/server-timeout'

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

  try {
    const repo = createFavoritesRepository()
    const exists = await withServerTimeout(repo.has(session.userId, slug), 5_000, 'favorites has')
    if (exists) {
      await withServerTimeout(repo.remove(session.userId, slug), 5_000, 'favorites remove')
      return { ok: true, favorited: false }
    }
    await withServerTimeout(repo.add(session.userId, slug), 5_000, 'favorites add')
    return { ok: true, favorited: true }
  } catch (e: unknown) {
    if ((e as Error)?.message === 'FAVORITES_LIMIT') {
      throw createError({ statusCode: 400, message: 'Máximo 30 favoritos. Elimina uno para añadir otro.' })
    }
    console.error('[api/account/favorites/toggle POST]', e)
    throw createError({ statusCode: 503, message: 'Favoritos no disponibles temporalmente' })
  }
})
