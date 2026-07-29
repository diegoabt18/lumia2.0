import { createError } from 'h3'
import { getMongoDb, resolveDbName } from './connection'

const DEFAULT_DB = 'catalog_db'

export async function getCatalogDb() {
  const config = useRuntimeConfig()
  const uri = config.mongoCatalogUri?.trim()
  if (!uri) {
    throw createError({
      statusCode: 503,
      message: 'Catálogo no configurado: define NUXT_MONGO_CATALOG_URI en .env',
    })
  }
  const dbName = resolveDbName(uri, DEFAULT_DB)
  return getMongoDb(uri, dbName)
}

export function isCatalogDbConfigured(): boolean {
  const config = useRuntimeConfig()
  return Boolean(config.mongoCatalogUri?.trim())
}
