import { isSalesDbConfigured } from '../../../database/sales'
import { createFavoritesRepository } from '../../../core/sales/favorites.repository'
import { getSessionFromEvent } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSessionFromEvent(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Inicia sesión para ver favoritos' })
  }
  if (!isSalesDbConfigured()) {
    return { slugs: [] as string[] }
  }
  const repo = createFavoritesRepository()
  const slugs = await repo.listSlugs(session.userId)
  return { slugs }
})
