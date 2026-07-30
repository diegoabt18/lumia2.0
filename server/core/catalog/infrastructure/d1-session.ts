import type { H3Event } from 'h3'
import {
  createCatalogReadSession,
  getCatalogBookmark,
  getCatalogD1,
  setCatalogBookmark,
  type CatalogD1DatabaseSession,
} from '../../../database/catalog-d1'

export function getCatalogReadSession(event: H3Event): CatalogD1DatabaseSession {
  const db = getCatalogD1(event)
  if (!db) throw new Error('CATALOG_DB binding not available')
  return createCatalogReadSession(db, getCatalogBookmark(event))
}

export function persistCatalogBookmark(event: H3Event, session: CatalogD1DatabaseSession) {
  setCatalogBookmark(event, session.getBookmark())
}
