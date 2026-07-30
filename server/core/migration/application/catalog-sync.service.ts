import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import type {
  MigrationSyncResult,
  MigrationTarget,
  MigrationStatusResponse,
  OutOfStockListResponse,
  OutOfStockProductItem,
  ProductSyncResult,
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
  listOutOfStockRows,
  countOutOfStockProducts,
  replaceOptions,
  replaceOptionsForProduct,
  setMigrationMeta,
  upsertCategories,
  upsertProducts,
  upsertPromotions,
  upsertVariants,
} from '../infrastructure/d1-catalog-writer'
import {
  loadMongoCatalogSnapshot,
  countMongoCatalogEntities,
  loadMongoProductBySlug,
} from '../infrastructure/mongo-catalog-source'
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
import { resolveVariantStockQuantities } from '../../catalog/application/resolve-variant-stock'
import { loadInventoryForSkus } from '../../catalog/infrastructure/inventory-summary.repository'
import type { VariantDoc } from '../../catalog/infrastructure/product.repository'
import { getCatalogDb } from '../../../database/catalog'
import { getD1SchemaInfo } from '../../../utils/d1-schema'

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

async function loadMongoAvailableBySku(skus: string[]): Promise<Map<string, number | null>> {
  if (!skus.length || !isCatalogDbConfigured()) return new Map()

  const db = await getCatalogDb()
  const variants = await db
    .collection<VariantDoc>('variants')
    .find({ sku: { $in: skus } })
    .project({ sku: 1, stock: 1, available: 1, reserved: 1, is_per_order: 1 })
    .toArray()
  const inventoryBySku = await loadInventoryForSkus(db, skus)

  const map = new Map<string, number | null>()
  for (const variant of variants) {
    const { available } = resolveVariantStockQuantities(variant, inventoryBySku.get(variant.sku))
    map.set(variant.sku, available)
  }
  return map
}

export async function listOutOfStockProducts(
  event: H3Event,
  options: { page?: number; limit?: number } = {}
): Promise<OutOfStockListResponse> {
  const page = Math.max(1, options.page ?? 1)
  const limit = Math.min(50, Math.max(1, options.limit ?? 20))
  const offset = (page - 1) * limit

  requireCatalogD1(event)
  const session = createMigrationWriteSession(event)
  const { hasReserved } = await getD1SchemaInfo(event)

  const [total, rows] = await Promise.all([
    countOutOfStockProducts(session, hasReserved),
    listOutOfStockRows(session, limit, offset, hasReserved),
  ])

  const skus = rows.map((row) => row.sku)
  const mongoAvailableBySku = await loadMongoAvailableBySku(skus)

  const bySlug = new Map<string, OutOfStockProductItem>()
  for (const row of rows) {
    const d1Base = row.available ?? row.stock ?? 0
    const d1Sellable = Math.max(0, d1Base - (row.reserved ?? 0))
    const mongoAvailable = mongoAvailableBySku.get(row.sku) ?? null
    const variant = {
      sku: row.sku,
      d1Stock: row.stock,
      d1Available: d1Sellable,
      mongoAvailable,
      isMadeToOrder: row.is_per_order === 1,
    }

    let item = bySlug.get(row.slug)
    if (!item) {
      item = {
        slug: row.slug,
        name: row.name,
        imagePath: row.image_path,
        categorySlug: row.category_slug,
        syncedAt: row.synced_at,
        variants: [],
        needsSync: false,
      }
      bySlug.set(row.slug, item)
    }
    item.variants.push(variant)
    if ((mongoAvailable ?? 0) > 0 && d1Sellable <= 0) {
      item.needsSync = true
    }
  }

  const items = [...bySlug.values()]

  return {
    items,
    total,
    page,
    limit,
  }
}

export async function syncProductBySlug(
  event: H3Event,
  slug: string,
  options: { triggeredBy?: string | null } = {}
): Promise<ProductSyncResult> {
  requireCatalogMongo()
  requireCatalogD1(event)

  const normalized = slug.trim()
  if (!normalized) {
    throw createError({ statusCode: 400, message: 'Slug de producto requerido' })
  }

  const bundle = await loadMongoProductBySlug(normalized)
  if (!bundle) {
    throw createError({ statusCode: 404, message: `Producto "${normalized}" no encontrado en MongoDB` })
  }

  const session = createMigrationWriteSession(event)
  let rowsWritten = 0

  if (bundle.category) {
    const db = await getCatalogDb()
    const productCount = bundle.product.category_slug
      ? await db.collection('products').countDocuments({
          category_slug: bundle.product.category_slug,
          status: { $ne: 'inactive' },
        })
      : 0
    const categoryRows = transformCategories([bundle.category], new Map([[bundle.category.slug, productCount]]))
    rowsWritten += await upsertCategories(session, categoryRows)
  }

  const productRows = transformProducts([bundle.product])
  rowsWritten += await upsertProducts(session, productRows)

  const variantRows = transformVariants(bundle.variants, bundle.inventoryBySku)
  rowsWritten += await upsertVariants(session, variantRows)

  const slugByMongoId = buildSlugByMongoId([bundle.product])
  const axes = transformOptionAxes(bundle.optionAxes, slugByMongoId)
  const axisIds = new Set(axes.map((a) => a.id))
  const values = transformOptionValues(bundle.optionValues, axisIds)
  const legacy = transformLegacyOptions(bundle.legacyOptions)
  rowsWritten += await replaceOptionsForProduct(session, normalized, axes, values, legacy)

  await setMigrationMeta(session, 'last_sync_at', new Date().toISOString())
  await setMigrationMeta(session, 'last_sync_target', `product:${normalized}`)
  if (options.triggeredBy) {
    await setMigrationMeta(session, 'last_sync_by', options.triggeredBy)
  }

  invalidateCatalogCaches()

  return {
    slug: normalized,
    rowsWritten,
    product: { name: bundle.product.name },
    variants: variantRows.map((row) => ({
      sku: row.sku,
      stock: row.stock,
      available: row.available,
    })),
  }
}
