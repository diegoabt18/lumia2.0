import type { H3Event } from 'h3'

interface RateLimitOptions {
  max: number
  windowMs: number
  /** Sufijo extra (p. ej. userId o cartKey) además de la IP. */
  keySuffix?: string
}

const buckets = new Map<string, { count: number; resetAt: number }>()

/** Límite en memoria por instancia Worker; suficiente para abuso casual. */
export function checkRateLimit(event: H3Event, route: string, options: RateLimitOptions): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const suffix = options.keySuffix?.trim() || ''
  const key = suffix ? `${route}:${suffix}:${ip}` : `${route}:${ip}`
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs })
    return
  }

  bucket.count += 1
  if (bucket.count > options.max) {
    throw createError({
      statusCode: 429,
      message: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
    })
  }
}
