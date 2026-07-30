import { getCookie, setCookie, type H3Event } from 'h3'

/** Subconjunto mínimo de D1Database usado por el catálogo. */
export interface CatalogD1Database {
  prepare(query: string): CatalogD1PreparedStatement
  withSession(bookmarkOrConstraint?: string): CatalogD1DatabaseSession
}

export interface CatalogD1PreparedStatement {
  bind(...values: unknown[]): CatalogD1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  all<T = unknown>(): Promise<{ results: T[]; meta?: CatalogD1ResultMeta }>
  run(): Promise<{ meta?: CatalogD1ResultMeta }>
}

export interface CatalogD1DatabaseSession extends CatalogD1Database {
  getBookmark(): string | null
}

export interface CatalogD1ResultMeta {
  served_by_region?: string
  served_by_primary?: boolean
  duration?: number
}

export const CATALOG_D1_BINDING = 'CATALOG_DB'
export const CATALOG_BOOKMARK_COOKIE = 'lumia_catalog_bookmark'

export type CatalogD1SessionBookmark = string

function cloudflareEnv(event?: H3Event): Record<string, unknown> | undefined {
  if (!event) return undefined
  const ctx = event.context as {
    cloudflare?: { env?: Record<string, unknown> }
  }
  return ctx.cloudflare?.env
}

export function getCatalogD1(event?: H3Event): CatalogD1Database | null {
  const env = cloudflareEnv(event)
  const db = env?.[CATALOG_D1_BINDING]
  if (!db || typeof db !== 'object') return null
  if (typeof (db as CatalogD1Database).prepare !== 'function') return null
  if (typeof (db as CatalogD1Database).withSession !== 'function') return null
  return db as CatalogD1Database
}

export function isCatalogD1Bound(event?: H3Event): boolean {
  return getCatalogD1(event) != null
}

export function isD1MissingTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('no such table') || message.includes('SQLITE_ERROR')
}

export async function isD1CatalogSchemaReady(event?: H3Event): Promise<boolean> {
  const db = getCatalogD1(event)
  if (!db) return false

  try {
    await db.prepare(`SELECT 1 FROM migration_meta LIMIT 1`).first()
    return true
  } catch {
    return false
  }
}

export async function pingCatalogD1(event?: H3Event): Promise<{
  bound: boolean
  connected: boolean
  schemaVersion: string | null
  servedByRegion?: string
  servedByPrimary?: boolean
}> {
  const db = getCatalogD1(event)
  if (!db) return { bound: false, connected: false, schemaVersion: null }

  try {
    const row = await db.prepare('SELECT 1 AS ok').first<{ ok: number }>()
    if (row?.ok !== 1) {
      return { bound: true, connected: false, schemaVersion: null }
    }

    const metaRow = await db
      .prepare(`SELECT value FROM migration_meta WHERE key = 'schema_version' LIMIT 1`)
      .first<{ value: string }>()

    return {
      bound: true,
      connected: true,
      schemaVersion: metaRow?.value ?? null,
    }
  } catch {
    return { bound: true, connected: false, schemaVersion: null }
  }
}

export function getCatalogBookmark(event: H3Event): CatalogD1SessionBookmark {
  return getCookie(event, CATALOG_BOOKMARK_COOKIE) ?? 'first-unconstrained'
}

export function setCatalogBookmark(event: H3Event, bookmark: string | null | undefined) {
  if (!bookmark) return
  if (event.node?.res?.headersSent) return
  try {
    setCookie(event, CATALOG_BOOKMARK_COOKIE, bookmark, {
      maxAge: 60 * 60,
      path: '/',
      sameSite: 'lax',
    })
  } catch {
    // Revalidación SWR en background u otro contexto sin headers mutables.
  }
}

/** Lecturas públicas: réplica cercana + consistencia secuencial por bookmark. */
export function createCatalogReadSession(
  db: CatalogD1Database,
  bookmark: CatalogD1SessionBookmark = 'first-unconstrained'
): CatalogD1DatabaseSession {
  return db.withSession(bookmark) as CatalogD1DatabaseSession
}

/** Escrituras/sync admin: siempre primary. */
export function createCatalogWriteSession(db: CatalogD1Database): CatalogD1DatabaseSession {
  return db.withSession('first-primary') as CatalogD1DatabaseSession
}
