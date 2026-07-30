import type { H3Event } from 'h3'
import type { CatalogSourceMode, ResolvedCatalogSource } from '#shared/types/catalog-source'
import { getCatalogD1, isCatalogD1Bound } from '../database/catalog-d1'
import { isCatalogDbConfigured } from '../database/catalog'

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

  try {
    const db = getCatalogD1(event)
    if (!db) return 'mongo'
    const row = await db.prepare(`SELECT COUNT(*) AS n FROM products`).first<{ n: number }>()
    if ((row?.n ?? 0) > 0) return 'd1'
  } catch {
    return 'mongo'
  }

  return 'mongo'
}
