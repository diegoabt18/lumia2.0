import { getMongoDb, resolveDbName } from '../database/connection'

export async function getSalesDb() {
  const config = useRuntimeConfig()
  const uri = config.mongoSalesUri?.trim()
  if (!uri) {
    throw createError({ statusCode: 503, message: 'MongoDB sales no configurado' })
  }
  return getMongoDb(uri, resolveDbName(uri, 'sales_db'))
}

export function isSalesDbConfigured(): boolean {
  const config = useRuntimeConfig()
  return Boolean(config.mongoSalesUri?.trim())
}
