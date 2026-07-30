import { invalidateProductD1ModuleCaches } from '../core/catalog/infrastructure/product-d1.repository'
import { invalidateCatalogSourceCache } from './catalog-source'
import { invalidateCacheByPrefix } from './memory-cache'

/** Tras sync Mongo → D1, vacía cachés in-memory del catálogo en el isolate. */
export function invalidateCatalogCaches(): number {
  invalidateCatalogSourceCache()
  invalidateProductD1ModuleCaches()
  return invalidateCacheByPrefix('catalog:')
}
