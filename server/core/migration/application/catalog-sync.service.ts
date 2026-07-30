import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import type {
  MigrationSyncResult,
  MigrationTarget,
  MigrationStatusResponse,
} from '#shared/types/migration'
import { SYNC_TARGET_ORDER } from '#shared/types/migration'
import { createMigrationWriteSession, requireCatalogMongo, requireCatalogD1 } from '../../../utils/require-migration'
import { getCatalogD1, pingCatalogD1 } from '../../../database/catalog-d1'
import { isCatalogDbConfigured } from '../../../database/catalog'
import {
  buildSlugByMongoId,
  transformCategories,
  transformLegacyOptions,
  transformOptionAxes,
  transformOptionValues,
  transformProducts,
  transformPromotions,
  transformVariants,
} from '../infrastructure/catalog-transformer'
import {
  countD1CatalogEntities,
  replaceOptions,
  setMigrationMeta,
  upsertCategories,
  upsertProducts,
  upsertPromotions,
  upsertVariants,
} from '../infrastructure/d1-catalog-writer'
import { loadMongoCatalogSnapshot, countMongoCatalogEntities } from '../infrastructure/mongo-catalog-source'
import {
  createMigrationLog,
  finishMigrationLog,
  getLatestMigrationLog,
  getMigrationLog,
  getMigrationMetaValue,
  listMigrationLogs,
} from '../infrastructure/migration-log.repository'
import { previewIntegrityFromMongo, validateCatalogIntegrity } from './integrity-validator'
import { invalidateCatalogCaches } from '../../../utils/catalog-cache'
import {
  getConfiguredCatalogSourceMode,
  resolveCatalogSourceForEventAsync,
} from '../../../utils/catalog-source'

export interface SyncOptions {
  dryRun?: boolean
  triggeredBy?: string | null
}

async function syncSingleTarget(
  event: H3Event,
  target: Exclude<MigrationTarget, 'full'>,
  snapshot: Awaited<ReturnType<typeof loadMongoCatalogSnapshot>>,
  dryRun: boolean
): Promise<{ rowsRead: number; rowsWritten: number }> {
  let rowsRead = 0
  let rowsWritten = 0

  if (dryRun) {
    switch (target) {
      case 'categories':
        rowsRead = snapshot.categories.length
        break
      case 'products':
        rowsRead = snapshot.products.length
        break
      case 'variants':
        rowsRead = snapshot.variants.length
        break
      case 'promotions':
        rowsRead = snapshot.promotions.length
        break
      case 'options': {
        const slugByMongoId = buildSlugByMongoId(snapshot.products)
        const axes = transformOptionAxes(snapshot.optionAxes, slugByMongoId)
        const axisIds = new Set(axes.map((a) => a.id))
        const values = transformOptionValues(snapshot.optionValues, axisIds)
        const legacy = transformLegacyOptions(snapshot.legacyOptions)
        rowsRead = axes.length + values.length + legacy.length
        break
      }
    }
    return { rowsRead, rowsWritten: rowsRead }
  }

  const session = createMigrationWriteSession(event)

  switch (target) {
    case 'categories': {
      rowsRead = snapshot.categories.length
      const rows = transformCategories(snapshot.categories, snapshot.productCountsByCategory)
      rowsWritten = await upsertCategories(session, rows)
      break
    }
    case 'products': {
      rowsRead = snapshot.products.length
      const rows = transformProducts(snapshot.products)
      rowsWritten = await upsertProducts(session, rows)
      break
    }
    case 'variants': {
      rowsRead = snapshot.variants.length
      const rows = transformVariants(snapshot.variants, snapshot.inventoryBySku)
      rowsWritten = await upsertVariants(session, rows)
      break
    }
    case 'promotions': {
      rowsRead = snapshot.promotions.length
      const rows = transformPromotions(snapshot.promotions)
      rowsWritten = await upsertPromotions(session, rows)
      break
    }
    case 'options': {
      const slugByMongoId = buildSlugByMongoId(snapshot.products)
      const axes = transformOptionAxes(snapshot.optionAxes, slugByMongoId)
      const axisIds = new Set(axes.map((a) => a.id))
      const values = transformOptionValues(snapshot.optionValues, axisIds)
      const legacy = transformLegacyOptions(snapshot.legacyOptions)
      rowsRead = axes.length + values.length + legacy.length
      rowsWritten = await replaceOptions(session, axes, values, legacy)
      break
    }
  }

  return { rowsRead, rowsWritten }
}

export async function runCatalogSync(
  event: H3Event,
  target: MigrationTarget,
  options: SyncOptions = {}
): Promise<MigrationSyncResult> {
  requireCatalogMongo()
  const dryRun = options.dryRun === true
  const triggeredBy = options.triggeredBy ?? null
  const logId = randomUUID()

  if (!dryRun) {
    requireCatalogD1(event)
  }

  const session = dryRun ? null : createMigrationWriteSession(event)
  if (!dryRun && session) {
    await createMigrationLog(session, { id: logId, target, triggeredBy })
  }

  let rowsRead = 0
  let rowsWritten = 0
  let status: 'success' | 'failed' = 'success'
  let error: string | undefined

  try {
    const snapshot = await loadMongoCatalogSnapshot()

    if (target === 'full') {
      for (const step of SYNC_TARGET_ORDER) {
        const result = await syncSingleTarget(event, step, snapshot, dryRun)
        rowsRead += result.rowsRead
        rowsWritten += result.rowsWritten
      }
    } else {
      const result = await syncSingleTarget(event, target, snapshot, dryRun)
      rowsRead = result.rowsRead
      rowsWritten = result.rowsWritten
    }

    if (!dryRun && session) {
      await setMigrationMeta(session, 'last_sync_at', new Date().toISOString())
      await setMigrationMeta(session, 'last_sync_target', target)
      if (triggeredBy) await setMigrationMeta(session, 'last_sync_by', triggeredBy)
      await setMigrationMeta(session, 'last_sync_rows_written', String(rowsWritten))
    }
  } catch (e: unknown) {
    status = 'failed'
    error = e instanceof Error ? e.message : String(e)
    if (!dryRun && session) {
      await finishMigrationLog(session, {
        id: logId,
        status: 'failed',
        rowsRead,
        rowsWritten,
        error,
      })
    }
    throw e
  }

  if (!dryRun && session) {
    await finishMigrationLog(session, {
      id: logId,
      status: 'success',
      rowsRead,
      rowsWritten,
      error: null,
    })
    invalidateCatalogCaches()
  }

  const integrity =
    dryRun || !session
      ? await previewIntegrityFromMongo()
      : await validateCatalogIntegrity(session)

  return {
    logId,
    target,
    dryRun,
    status,
    rowsRead,
    rowsWritten,
    integrity,
    error,
  }
}

export async function getMigrationStatus(event: H3Event): Promise<MigrationStatusResponse> {
  const mongoConfigured = isCatalogDbConfigured()
  const d1Ping = await pingCatalogD1(event)
  const db = getCatalogD1(event)
  const catalogSourceMode = getConfiguredCatalogSourceMode()
  const activeCatalogSource = await resolveCatalogSourceForEventAsync(event)

  let counts: MigrationStatusResponse['counts'] = { mongo: null, d1: null }
  let latestLog = null
  let lastSyncAt: string | null = null
  let lastSyncTarget: string | null = null
  let lastSyncBy: string | null = null
  let d1HasProducts = false

  if (mongoConfigured) {
    try {
      counts.mongo = await countMongoCatalogEntities()
    } catch {
      counts.mongo = null
    }
  }

  if (db && d1Ping.connected) {
    try {
      const session = createMigrationWriteSession(event)
      counts.d1 = await countD1CatalogEntities(session)
      d1HasProducts = (counts.d1?.products ?? 0) > 0
      lastSyncAt = await getMigrationMetaValue(session, 'last_sync_at')
      lastSyncTarget = await getMigrationMetaValue(session, 'last_sync_target')
      lastSyncBy = await getMigrationMetaValue(session, 'last_sync_by')
      latestLog = await getLatestMigrationLog(session)
    } catch {
      counts.d1 = null
    }
  }

  const cutoverReady =
    mongoConfigured &&
    d1Ping.bound &&
    d1Ping.connected &&
    d1HasProducts &&
    catalogSourceMode === 'auto'

  return {
    mongoConfigured,
    d1Bound: d1Ping.bound,
    d1Connected: d1Ping.connected,
    schemaVersion: d1Ping.schemaVersion,
    catalogSourceMode,
    activeCatalogSource,
    d1HasProducts,
    cutoverReady,
    lastSyncAt,
    lastSyncTarget,
    lastSyncBy,
    counts,
    latestLog,
  }
}

export { getMigrationLog, listMigrationLogs }
