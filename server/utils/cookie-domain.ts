import type { H3Event } from 'h3'

/** Dominio compartido para cookies entre apex y www (ej. `.lumiadalistore.com`). */
export function sharedCookieDomain(event: H3Event): string | undefined {
  const config = useRuntimeConfig()
  const siteUrl = config.siteUrl?.trim()
  let host: string | undefined

  if (siteUrl) {
    try {
      host = new URL(siteUrl).hostname
    } catch {
      /* ignore */
    }
  }
  if (!host) {
    host = getRequestURL(event).hostname
  }

  if (!host || host === 'localhost' || host.endsWith('.workers.dev')) {
    return undefined
  }

  const parts = host.replace(/^www\./, '').split('.')
  if (parts.length < 2) return undefined
  return `.${parts.slice(-2).join('.')}`
}

/** Origen OAuth: respeta www vs apex si pertenecen al mismo sitio. */
export function resolveSiteOrigin(event: H3Event): string {
  const config = useRuntimeConfig()
  const requestUrl = getRequestURL(event)
  const configured = config.siteUrl?.trim()?.replace(/\/$/, '')

  if (!configured) return requestUrl.origin

  try {
    const reqApex = requestUrl.hostname.replace(/^www\./, '')
    const cfgApex = new URL(configured).hostname.replace(/^www\./, '')
    if (reqApex === cfgApex) return requestUrl.origin
  } catch {
    /* use configured */
  }

  return configured
}
