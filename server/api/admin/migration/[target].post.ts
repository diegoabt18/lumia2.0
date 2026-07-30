import { parseMigrationTarget } from '#shared/types/migration'
import { requireMigrationAdmin } from '../../../utils/require-migration'
import { runCatalogSync } from '../../../core/migration/application/catalog-sync.service'

export default defineEventHandler(async (event) => {
  const session = await requireMigrationAdmin(event)
  const raw = getRouterParam(event, 'target')
  const target = parseMigrationTarget(raw)

  if (!target || target === 'full') {
    throw createError({
      statusCode: 400,
      message: 'Target inválido. Usa categories, products, variants, promotions u options.',
    })
  }

  const result = await runCatalogSync(event, target, {
    dryRun: false,
    triggeredBy: session.email,
  })

  return { ok: true, result }
})
