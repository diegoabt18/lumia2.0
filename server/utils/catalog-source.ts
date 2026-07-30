import type { H3Event } from 'h3'
import type { CatalogSourceMode, ResolvedCatalogSource } from '#shared/types/catalog-source'
import { getCatalogD1, isCatalogD1Bound, pingCatalogD1 } from '../database/catalog-d1'
import { isCatalogDbConfigured } from '../database/catalog'

const AUTO_SOURCE_TTL_MS = 5 * 60 * 1000
let autoSourceCache: { at: number; source: ResolvedCatalogSource } | null = null

export function invalidateCatalogSourceCache(): void {
  autoSourceCache = null
}

export function parseCatalogSourceMode(raw: unknown): CatalogSourceMode {
  if (raw === 'd1' || raw === 'mongo' || raw === 'auto') return raw
  return 'mongo'
}

export function getConfiguredCatalogSourceMode(): CatalogSourceMode {
  const config = useRuntimeConfig()
  return parseCatalogSourceMode(config.catalogSource)
}

export function resolveCatalogSource(options: {
  mode: CatalogSourceMode
  d1Available: boolean
  mongoAvailable: boolean
}): ResolvedCatalogSource {
  const { mode, d1Available, mongoAvailable } = options

  if (mode === 'd1') {
    return 'd1'
  }

  if (mode === 'mongo') {
    if (mongoAvailable) return 'mongo'
    if (d1Available) return 'd1'
    return 'mongo'
  }

  // auto
  if (d1Available) return 'd1'
  if (mongoAvailable) return 'mongo'
  return 'd1'
}

export function resolveCatalogSourceForEvent(event?: H3Event): ResolvedCatalogSource {
  const mode = getConfiguredCatalogSourceMode()
  const d1Available = isCatalogD1Bound(event)
  const mongoAvailable = isCatalogDbConfigured()
  return resolveCatalogSource({ mode, d1Available, mongoAvailable })
}

async function d1HasSyncedCatalog(event?: H3Event): Promise<boolean> {
  const db = getCatalogD1(event)
  if (!db) return false

  try {
    const product = await db.prepare(`SELECT 1 AS ok FROM products LIMIT 1`).first<{ ok: number }>()
    if (product?.ok === 1) return true

    const meta = await db
      .prepare(`SELECT value FROM migration_meta WHERE key = 'last_sync_at' LIMIT 1`)
      .first<{ value: string }>()
    return Boolean(meta?.value?.trim())
  } catch {
    return false
  }
}

/** En modo `auto`, usa D1 si hay binding + schema + datos sync; evita fallback lento a Mongo. */
export async function resolveCatalogSourceForEventAsync(event?: H3Event): Promise<ResolvedCatalogSource> {
  const mode = getConfiguredCatalogSourceMode()
  const d1Available = isCatalogD1Bound(event)
  const mongoAvailable = isCatalogDbConfigured()

  if (mode === 'd1') {
    return 'd1'
  }

  if (mode === 'mongo') {
    return resolveCatalogSource({ mode, d1Available, mongoAvailable })
  }

  // auto
  if (!d1Available) {
    return mongoAvailable ? 'mongo' : 'd1'
  }

  const cached = autoSourceCache
  if (cached && Date.now() - cached.at < AUTO_SOURCE_TTL_MS) {
    return cached.source
  }

  const d1Ping = await pingCatalogD1(event)
  if (d1Ping.bound && d1Ping.connected) {
    const hasData = await d1HasSyncedCatalog(event)
    if (hasData) {
      autoSourceCache = { at: Date.now(), source: 'd1' }
      return 'd1'
    }
  }

  autoSourceCache = { at: Date.now(), source: mongoAvailable ? 'mongo' : 'd1' }
  return mongoAvailable ? 'mongo' : 'd1'
}
