import type { H3Event } from 'h3'
import { getCatalogD1 } from '../database/catalog-d1'

const SCHEMA_TTL_MS = 60_000
let schemaCache: { at: number; version: string | null; hasReserved: boolean } | null = null

export async function getD1SchemaInfo(event?: H3Event): Promise<{
  version: string | null
  hasReserved: boolean
}> {
  const now = Date.now()
  if (schemaCache && now - schemaCache.at < SCHEMA_TTL_MS) {
    return { version: schemaCache.version, hasReserved: schemaCache.hasReserved }
  }

  const db = getCatalogD1(event)
  if (!db) {
    schemaCache = { at: now, version: null, hasReserved: false }
    return { version: null, hasReserved: false }
  }

  let version: string | null = null
  let hasReserved = false

  try {
    const meta = await db
      .prepare(`SELECT value FROM migration_meta WHERE key = 'schema_version' LIMIT 1`)
      .first<{ value: string }>()
    version = meta?.value?.trim() ?? null
  } catch {
    version = null
  }

  try {
    await db.prepare(`SELECT reserved FROM variants LIMIT 1`).first()
    hasReserved = true
  } catch {
    hasReserved = false
  }

  if (!hasReserved && version) {
    const n = parseInt(version, 10)
    if (!Number.isNaN(n) && n >= 2) hasReserved = true
  }

  schemaCache = { at: now, version, hasReserved }
  return { version, hasReserved }
}

export function invalidateD1SchemaCache(): void {
  schemaCache = null
}

/** Columnas SELECT de variants según schema (002+ incluye reserved). */
export function variantSelectSql(hasReserved: boolean): string {
  const base = `sku, product_slug, price, compare_at_price, currency, options_json, image_path,
    stock, available, is_per_order, option_rules_json, option_value_ids_json`
  if (hasReserved) {
    return `${base}, COALESCE(reserved, 0) AS reserved`
  }
  return `${base}, 0 AS reserved`
}
