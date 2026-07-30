import { requireMigrationAdmin } from '../../../utils/require-migration'
import { listOutOfStockProducts } from '../../../core/migration/application/catalog-sync.service'

export default defineEventHandler(async (event) => {
  await requireMigrationAdmin(event)
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))

  const list = await listOutOfStockProducts(event, { page, limit })
  return { ok: true, ...list }
})
