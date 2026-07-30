import { parseMigrationTarget } from '#shared/types/migration'
import { requireMigrationAdmin } from '../../../utils/require-migration'
import { runCatalogSync } from '../../../core/migration/application/catalog-sync.service'

export default defineEventHandler(async (event) => {
  const session = await requireMigrationAdmin(event)
  const body = (await readBody(event).catch(() => ({}))) as { target?: string }
  const target = parseMigrationTarget(body?.target) ?? 'full'

  const result = await runCatalogSync(event, target, {
    dryRun: true,
    triggeredBy: session.email,
  })

  return { ok: true, result }
})
