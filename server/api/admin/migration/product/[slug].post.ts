import { requireMigrationAdmin } from '../../../../utils/require-migration'
import { syncProductBySlug } from '../../../../core/migration/application/catalog-sync.service'

export default defineEventHandler(async (event) => {
  const session = await requireMigrationAdmin(event)
  const slug = getRouterParam(event, 'slug')?.trim()

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug de producto requerido' })
  }

  const result = await syncProductBySlug(event, slug, { triggeredBy: session.email })
  return { ok: true, result }
})
