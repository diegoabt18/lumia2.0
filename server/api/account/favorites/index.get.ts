import { isSalesDbConfigured } from '../../../database/sales'
import { createFavoritesRepository } from '../../../core/sales/favorites.repository'
import { getSessionFromEvent } from '../../../utils/session'
import { withServerTimeout } from '../../../utils/server-timeout'

export default defineEventHandler(async (event) => {
  const session = await getSessionFromEvent(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Inicia sesión para ver favoritos' })
  }
  if (!isSalesDbConfigured()) {
    return { slugs: [] as string[] }
  }

  try {
    const repo = createFavoritesRepository()
    const slugs = await withServerTimeout(repo.listSlugs(session.userId), 5_000, 'favorites list')
    return { slugs }
  } catch (e) {
    console.error('[api/account/favorites GET]', e)
    return { slugs: [] as string[] }
  }
})
