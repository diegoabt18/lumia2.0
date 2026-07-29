import type { H3Event } from 'h3'
import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose'

export const SESSION_COOKIE = 'lumia_session'
const OAUTH_COOKIE_PATH = '/api/auth/google'

export interface SessionPayload {
  userId: string
  email: string
  role: 'user' | 'admin'
}

function sessionCookieOpts(event: H3Event, maxAgeSec: number) {
  const proto = getRequestProtocol(event, { xForwardedProto: true })
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: proto === 'https',
    path: '/',
    maxAge: maxAgeSec,
  }
}

export function oauthCookieOpts(event: H3Event) {
  const proto = getRequestProtocol(event, { xForwardedProto: true })
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: proto === 'https',
    path: OAUTH_COOKIE_PATH,
    maxAge: 600,
  }
}

export async function signSessionToken(payload: SessionPayload, secret: string, maxAgeSec = 60 * 60 * 24 * 7) {
  const key = new TextEncoder().encode(secret)
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(key)
}

export async function verifySessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  try {
    const key = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, key)
    if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') return null
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role === 'admin' ? 'admin' : 'user',
    }
  } catch {
    return null
  }
}

export function setSessionCookie(event: H3Event, token: string, maxAgeSec = 60 * 60 * 24 * 7) {
  setCookie(event, SESSION_COOKIE, token, sessionCookieOpts(event, maxAgeSec))
}

export function clearSessionCookie(event: H3Event) {
  const o = sessionCookieOpts(event, 0)
  deleteCookie(event, SESSION_COOKIE, { path: o.path, sameSite: o.sameSite, secure: o.secure })
}

export async function getSessionFromEvent(event: H3Event): Promise<SessionPayload | null> {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret?.trim()
  if (!secret) return null
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
  return verifySessionToken(token, secret)
}

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export async function verifyGoogleIdToken(idToken: string, clientId: string) {
  const { payload } = await jwtVerify(idToken, googleJwks, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: clientId,
  })
  const sub = typeof payload.sub === 'string' ? payload.sub : ''
  const email = typeof payload.email === 'string' ? payload.email : ''
  const name = typeof payload.name === 'string' ? payload.name : email
  const picture = typeof payload.picture === 'string' ? payload.picture : undefined
  if (!sub || !email) return null
  return { googleId: sub, email, name, avatar: picture }
}

export function safeReturnPath(raw: string | undefined, fallback = '/'): string {
  const v = raw?.trim()
  if (!v || !v.startsWith('/') || v.startsWith('//')) return fallback
  return v
}
