import { requireMigrationAdmin, createMigrationWriteSession } from '../../../utils/require-migration'
import { listMigrationLogs } from '../../../core/migration/infrastructure/migration-log.repository'

export default defineEventHandler(async (event) => {
  await requireMigrationAdmin(event)
  const query = getQuery(event)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const session = createMigrationWriteSession(event)
  const items = await listMigrationLogs(session, limit)
  return { ok: true, items }
})
