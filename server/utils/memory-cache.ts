import { setHeader, type H3Event } from 'h3'

type CacheEntry<T> = { at: number; value: T }

const stores = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

async function loadAndStore<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key) as Promise<T> | undefined
  if (pending) return pending

  const promise = loader()
    .then((value) => {
      stores.set(key, { at: Date.now(), value })
      return value
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

/** Caché en memoria del Worker con deduplicación y stale-while-revalidate. */
export async function getCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  staleMs = ttlMs * 4
): Promise<T> {
  const now = Date.now()
  const hit = stores.get(key) as CacheEntry<T> | undefined

  if (hit) {
    const age = now - hit.at
    if (age < ttlMs) return hit.value
    if (age < staleMs) {
      void loadAndStore(key, loader).catch(() => {})
      return hit.value
    }
  }

  return loadAndStore(key, loader)
}

export function setPublicCacheHeaders(event: H3Event, seconds: number) {
  const value = `public, max-age=${seconds}, s-maxage=${seconds * 2}, stale-while-revalidate=${seconds * 4}`
  setHeader(event, 'Cache-Control', value)
}
