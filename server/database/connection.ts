import { MongoClient, type Db } from 'mongodb'
import { setServers } from 'node:dns'
import { createError } from 'h3'

interface MongoPool {
  client: MongoClient
  db: Db
}

const pools = new Map<string, MongoPool>()
const lastPingOkAt = new Map<string, number>()
const PING_TTL_MS = 30_000
const WORKERS_PING_TTL_MS = 120_000
let dnsServersConfigured = false

function isCloudflareWorkersRuntime(): boolean {
  return typeof globalThis.caches !== 'undefined' && 'WebSocketPair' in globalThis
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

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

function mongoClientOptions() {
  const onWorkers = isCloudflareWorkersRuntime()
  return {
    serverSelectionTimeoutMS: onWorkers ? 5000 : 8000,
    socketTimeoutMS: onWorkers ? 10000 : 60000,
    connectTimeoutMS: onWorkers ? 5000 : 10000,
    maxPoolSize: onWorkers ? 1 : undefined,
    maxIdleTimeMS: onWorkers ? 10000 : undefined,
  }
}

async function pingPool(pool: MongoPool, dbName: string): Promise<void> {
  await withTimeout(
    pool.client.db(dbName).command({ ping: 1 }, { serverSelectionTimeoutMS: 2000 }),
    2500,
    'mongo ping'
  )
}

async function disposePool(key: string, pool: MongoPool) {
  pools.delete(key)
  await pool.client.close().catch(() => {})
}

/**
 * Obtiene (o crea) un pool de conexión MongoDB para una URI + nombre de base.
 * En Workers el ping tiene timeout duro para no colgar el isolate si la conexión quedó zombi.
 */
export async function getMongoDb(uri: string, dbName: string): Promise<Db> {
  ensurePublicDnsForSrv(uri)
  const onWorkers = isCloudflareWorkersRuntime()
  const key = `${uri}::${dbName}`
  const existing = pools.get(key)

  if (existing) {
    const pingTtl = onWorkers ? WORKERS_PING_TTL_MS : PING_TTL_MS
    const pingFresh = Date.now() - (lastPingOkAt.get(key) ?? 0) < pingTtl
    if (pingFresh) return existing.db
    if (onWorkers) {
      lastPingOkAt.set(key, Date.now())
      return existing.db
    }
    try {
      await pingPool(existing, dbName)
      lastPingOkAt.set(key, Date.now())
      return existing.db
    } catch {
      lastPingOkAt.delete(key)
      await disposePool(key, existing)
    }
  }

  const client = new MongoClient(uri, mongoClientOptions())

  try {
    await withTimeout(client.connect(), onWorkers ? 4000 : 10000, 'mongo connect')
    const db = client.db(dbName)
    pools.set(key, { client, db })
    lastPingOkAt.set(key, Date.now())
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
