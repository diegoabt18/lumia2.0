import { requireMigrationAdmin } from '../../../utils/require-migration'
import { runCatalogSync } from '../../../core/migration/application/catalog-sync.service'

export default defineEventHandler(async (event) => {
  const session = await requireMigrationAdmin(event)

  const result = await runCatalogSync(event, 'full', {
    dryRun: false,
    triggeredBy: session.email,
  })

  return { ok: true, result }
})
