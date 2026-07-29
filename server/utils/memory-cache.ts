import { setHeader, type H3Event } from 'h3'

type CacheEntry<T> = { at: number; value: T }

const stores = new Map<string, CacheEntry<unknown>>()

export async function getCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now()
  const hit = stores.get(key) as CacheEntry<T> | undefined
  if (hit && now - hit.at < ttlMs) return hit.value
  const value = await loader()
  stores.set(key, { at: now, value })
  return value
}

export function setPublicCacheHeaders(event: H3Event, seconds: number) {
  const value = `public, max-age=${seconds}, s-maxage=${seconds * 2}, stale-while-revalidate=${seconds * 4}`
  setHeader(event, 'Cache-Control', value)
}
