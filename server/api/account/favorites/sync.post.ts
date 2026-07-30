import { isSalesDbConfigured } from '../../../database/sales'
import { createFavoritesRepository } from '../../../core/sales/favorites.repository'
import { getSessionFromEvent } from '../../../utils/session'
import { withServerTimeout } from '../../../utils/server-timeout'

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

  try {
    const repo = createFavoritesRepository()
    const merged = await withServerTimeout(repo.mergeSlugs(session.userId, slugs), 8_000, 'favorites sync')
    return { slugs: merged }
  } catch (e) {
    console.error('[api/account/favorites/sync POST]', e)
    return { slugs: [] as string[] }
  }
})
