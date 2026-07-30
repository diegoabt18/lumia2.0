import { requireMigrationAdmin } from '../../../utils/require-migration'
import { getMigrationStatus } from '../../../core/migration/application/catalog-sync.service'

export default defineEventHandler(async (event) => {
  await requireMigrationAdmin(event)
  const status = await getMigrationStatus(event)
  return { ok: true, status }
})
