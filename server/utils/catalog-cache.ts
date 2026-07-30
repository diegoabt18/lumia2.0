import { invalidateCacheByPrefix } from './memory-cache'

/** Tras sync Mongo → D1, vacía cachés in-memory del catálogo en el isolate. */
export function invalidateCatalogCaches(): number {
  return invalidateCacheByPrefix('catalog:')
}
