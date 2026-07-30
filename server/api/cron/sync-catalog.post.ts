import { isCatalogDbConfigured } from '../../database/catalog'
import { isCatalogD1Bound, pingCatalogD1 } from '../../database/catalog-d1'
import { requireCronAuth } from '../../utils/require-cron'
import { runCatalogSync } from '../../core/migration/application/catalog-sync.service'
import { hasRunningMigrationLog } from '../../core/migration/infrastructure/migration-log.repository'
import { createMigrationWriteSession } from '../../utils/require-migration'

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  requireCronAuth(event)

  if (!isCatalogDbConfigured()) {
    throw createError({ statusCode: 503, message: 'MongoDB catálogo no configurado' })
  }

  const d1Ping = await pingCatalogD1(event)
  if (!isCatalogD1Bound(event) || !d1Ping.connected) {
    throw createError({ statusCode: 503, message: 'D1 catálogo no disponible' })
  }

  const session = createMigrationWriteSession(event)
  if (await hasRunningMigrationLog(session)) {
    return { ok: true, skipped: true, reason: 'sync_already_running' }
  }

  const result = await runCatalogSync(event, 'full', {
    dryRun: false,
    triggeredBy: 'cron',
  })

  return { ok: true, skipped: false, result }
})
