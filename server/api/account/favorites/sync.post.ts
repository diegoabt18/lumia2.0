import { isSalesDbConfigured } from '../../../database/sales'
import { createFavoritesRepository } from '../../../core/sales/favorites.repository'
import { getSessionFromEvent } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSessionFromEvent(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Inicia sesión' })
  }
  if (!isSalesDbConfigured()) {
    return { slugs: [] as string[] }
  }

  const body = await readBody(event).catch(() => ({})) as { slugs?: string[] }
  const slugs = Array.isArray(body.slugs) ? body.slugs : []
  const repo = createFavoritesRepository()
  const merged = await repo.mergeSlugs(session.userId, slugs)
  return { slugs: merged }
})
