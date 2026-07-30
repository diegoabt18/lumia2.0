import { MongoClient, type Db } from 'mongodb'
import { setServers } from 'node:dns'
import { createError } from 'h3'

interface MongoPool {
  client: MongoClient
}

/** Un cliente TCP por URI (comparte conexión entre sales_db, catalog_db, etc.). */
const pools = new Map<string, MongoPool>()
const lastPingOkAt = new Map<string, number>()
const PING_TTL_MS = 30_000
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
    serverSelectionTimeoutMS: onWorkers ? 8000 : 8000,
    socketTimeoutMS: onWorkers ? 20000 : 60000,
    connectTimeoutMS: onWorkers ? 8000 : 10000,
    maxPoolSize: onWorkers ? 4 : undefined,
    maxIdleTimeMS: onWorkers ? 30000 : undefined,
  }
}

async function pingPool(pool: MongoPool): Promise<void> {
  await withTimeout(
    pool.client.db('admin').command({ ping: 1 }, { serverSelectionTimeoutMS: 3000 }),
    3500,
    'mongo ping'
  )
}

async function disposePool(uri: string, pool: MongoPool) {
  pools.delete(uri)
  lastPingOkAt.delete(uri)
  await pool.client.close().catch(() => {})
}

export async function getMongoDb(uri: string, dbName: string): Promise<Db> {
  ensurePublicDnsForSrv(uri)
  const onWorkers = isCloudflareWorkersRuntime()
  const existing = pools.get(uri)

  if (existing) {
    // En Workers el ping bloquea cada checkout si el pool caduca; confía en el cliente y reconecta solo al fallar.
    if (onWorkers) return existing.client.db(dbName)

    const pingTtl = PING_TTL_MS
    const pingFresh = Date.now() - (lastPingOkAt.get(uri) ?? 0) < pingTtl
    if (pingFresh) return existing.client.db(dbName)
    try {
      await pingPool(existing)
      lastPingOkAt.set(uri, Date.now())
      return existing.client.db(dbName)
    } catch {
      await disposePool(uri, existing)
    }
  }

  const client = new MongoClient(uri, mongoClientOptions())

  try {
    await withTimeout(client.connect(), onWorkers ? 8000 : 10000, 'mongo connect')
    pools.set(uri, { client })
    lastPingOkAt.set(uri, Date.now())
    return client.db(dbName)
  } catch (e) {
    await client.close().catch(() => {})
    console.error(`[mongo] Connection failed (${dbName}):`, e)
    throw createError({
      statusCode: 503,
      message: `No se pudo conectar a MongoDB (${dbName}). Revisa la URI y Network Access en Atlas.`,
    })
  }
}

export function resolveDbName(uri: string, fallback: string): string {
  try {
    const pathname = new URL(uri.replace('mongodb+srv://', 'https://')).pathname
    const name = pathname.replace(/^\//, '').split('?')[0]
    return name || fallback
  } catch {
    return fallback
  }
}
