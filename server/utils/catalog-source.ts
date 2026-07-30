import type { H3Event } from 'h3'
import type { CatalogSourceMode, ResolvedCatalogSource } from '#shared/types/catalog-source'
import { getCatalogD1, isCatalogD1Bound } from '../database/catalog-d1'
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

  if (mode === 'mongo') {
    if (mongoAvailable) return 'mongo'
    if (d1Available) return 'd1'
    return 'mongo'
  }

  if (mode === 'd1') {
    if (d1Available) return 'd1'
    if (mongoAvailable) return 'mongo'
    return 'd1'
  }

  if (d1Available) return 'd1'
  if (mongoAvailable) return 'mongo'
  return 'mongo'
}

export function resolveCatalogSourceForEvent(event?: H3Event): ResolvedCatalogSource {
  const mode = getConfiguredCatalogSourceMode()
  const d1Available = isCatalogD1Bound(event)
  const mongoAvailable = isCatalogDbConfigured()
  return resolveCatalogSource({ mode, d1Available, mongoAvailable })
}

/** En modo `auto`, prefiere D1 solo si tiene productos; si no, Mongo. */
export async function resolveCatalogSourceForEventAsync(event?: H3Event): Promise<ResolvedCatalogSource> {
  const mode = getConfiguredCatalogSourceMode()
  const d1Available = isCatalogD1Bound(event)
  const mongoAvailable = isCatalogDbConfigured()

  if (mode !== 'auto' || !d1Available) {
    return resolveCatalogSource({ mode, d1Available, mongoAvailable })
  }

  if (!mongoAvailable) return 'd1'

  const cached = autoSourceCache
  if (cached && Date.now() - cached.at < AUTO_SOURCE_TTL_MS) {
    return cached.source
  }

  let resolved: ResolvedCatalogSource = 'mongo'
  try {
    const db = getCatalogD1(event)
    if (db) {
      const row = await db.prepare(`SELECT 1 FROM products LIMIT 1`).first<{ '1': number }>()
      if (row) resolved = 'd1'
    }
  } catch {
    resolved = 'mongo'
  }

  autoSourceCache = { at: Date.now(), source: resolved }
  return resolved
}
