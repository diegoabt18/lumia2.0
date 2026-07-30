import { createError, type H3Event } from 'h3'
import {
  createCatalogWriteSession,
  getCatalogD1,
  type CatalogD1Database,
  type CatalogD1DatabaseSession,
} from '../database/catalog-d1'
import { isCatalogDbConfigured } from '../database/catalog'
import { requireAdmin } from './require-admin'
import type { SessionPayload } from './session'

export async function requireMigrationAdmin(event: H3Event): Promise<SessionPayload> {
  return requireAdmin(event)
}

export function requireCatalogD1(event: H3Event): CatalogD1Database {
  const db = getCatalogD1(event)
  if (!db) {
    throw createError({
      statusCode: 503,
      message: 'D1 catálogo no disponible. Usa `npm run cf:dev` o despliega con binding CATALOG_DB.',
    })
  }
  return db
}

export function requireCatalogMongo(): void {
  if (!isCatalogDbConfigured()) {
    throw createError({
      statusCode: 503,
      message: 'MongoDB catálogo no configurado (NUXT_MONGO_CATALOG_URI).',
    })
  }
}

export function createMigrationWriteSession(event: H3Event): CatalogD1DatabaseSession {
  const db = requireCatalogD1(event)
  return createCatalogWriteSession(db)
}
