import type { H3Event } from 'h3'
import { randomUUID } from 'node:crypto'
import { sharedCookieDomain } from './cookie-domain'

export const GUEST_CART_COOKIE = 'lumia_guest_cart'
const GUEST_KEY_PREFIX = 'guest:'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function guestCartCookieOpts(event: H3Event) {
  const proto = getRequestProtocol(event, { xForwardedProto: true })
  const domain = sharedCookieDomain(event)
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: proto === 'https',
    path: '/',
    maxAge: 60 * 60 * 24 * 60,
    ...(domain ? { domain } : {}),
  }
}

export function guestCartKeyFromCookieValue(raw: string | undefined | null): string | null {
  const v = raw?.trim()
  if (!v || !UUID_RE.test(v)) return null
  return `${GUEST_KEY_PREFIX}${v}`
}

export function getGuestCartKeyFromEvent(event: H3Event): string | null {
  return guestCartKeyFromCookieValue(getCookie(event, GUEST_CART_COOKIE))
}

export function ensureGuestCartKey(event: H3Event): string {
  const existing = getGuestCartKeyFromEvent(event)
  if (existing) return existing
  const id = randomUUID()
  setCookie(event, GUEST_CART_COOKIE, id, guestCartCookieOpts(event))
  return `${GUEST_KEY_PREFIX}${id}`
}

export function clearGuestCartCookie(event: H3Event) {
  const o = guestCartCookieOpts(event)
  deleteCookie(event, GUEST_CART_COOKIE, {
    path: o.path,
    sameSite: o.sameSite,
    secure: o.secure,
    ...(o.domain ? { domain: o.domain } : {}),
  })
}
