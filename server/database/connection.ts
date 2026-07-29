import { MongoClient, type Db } from 'mongodb'
import { setServers } from 'node:dns'
import { createError } from 'h3'

interface MongoPool {
  client: MongoClient
  db: Db
}

const pools = new Map<string, MongoPool>()
let dnsServersConfigured = false

/**
 * Algunos DNS de router/ISP (p. ej. GPON) responden a nslookup pero rechazan
 * querySrv desde Node → mongodb+srv:// falla con ECONNREFUSED.
 * DNS públicos evitan eso en dev local; en Workers/Atlas suele no hacer falta.
 */
function ensurePublicDnsForSrv(uri: string) {
  if (dnsServersConfigured || !uri.startsWith('mongodb+srv://')) return
  try {
    setServers(['1.1.1.1', '8.8.8.8', '8.8.4.4'])
    dnsServersConfigured = true
  } catch {
    /* runtime sin node:dns */
  }
}

/**
 * Obtiene (o crea) un pool de conexión MongoDB para una URI + nombre de base.
 * Cacheado a nivel de isolate del Worker — se invalida si el ping falla.
 */
export async function getMongoDb(uri: string, dbName: string): Promise<Db> {
  ensurePublicDnsForSrv(uri)
  const key = `${uri}::${dbName}`
  const existing = pools.get(key)

  if (existing) {
    try {
      await existing.client.db(dbName).command({ ping: 1 }, { serverSelectionTimeoutMS: 3000 })
      return existing.db
    } catch {
      await existing.client.close().catch(() => {})
      pools.delete(key)
    }
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 60000,
  })

  try {
    await client.connect()
    const db = client.db(dbName)
    pools.set(key, { client, db })
    return db
  } catch (e) {
    await client.close().catch(() => {})
    console.error(`[mongo] Connection failed (${dbName}):`, e)
    throw createError({
      statusCode: 503,
      message: `No se pudo conectar a MongoDB (${dbName}). Revisa la URI y Network Access en Atlas.`,
    })
  }
}

/** Extrae el nombre de base de la URI o usa el fallback. */
export function resolveDbName(uri: string, fallback: string): string {
  try {
    const pathname = new URL(uri.replace('mongodb+srv://', 'https://')).pathname
    const name = pathname.replace(/^\//, '').split('?')[0]
    return name || fallback
  } catch {
    return fallback
  }
}
