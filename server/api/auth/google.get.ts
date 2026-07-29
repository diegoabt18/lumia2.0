import { randomBytes } from 'node:crypto'
import { isAuthDbConfigured } from '../../database/auth'
import { resolveSiteOrigin } from '../../utils/cookie-domain'
import { oauthCookieOpts, safeReturnPath } from '../../utils/session'
import { checkRateLimit } from '../../utils/rate-limit'
import { verifyTurnstileToken } from '../../utils/turnstile'

const OAUTH_RETURN_COOKIE = 'oauth_return'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.googleClientId?.trim()) {
    throw createError({ statusCode: 500, message: 'Google OAuth no configurado' })
  }
  if (!isAuthDbConfigured()) {
    throw createError({ statusCode: 503, message: 'MongoDB auth no configurado' })
  }

  checkRateLimit(event, 'auth:google', { max: 20, windowMs: 60_000 })

  const query = getQuery(event)
  const turnstileSecret = String(config.turnstileSecretKey || '').trim()
  if (turnstileSecret) {
    const token = typeof query.turnstile === 'string' ? query.turnstile.trim() : ''
    if (!token) {
      throw createError({ statusCode: 400, message: 'Completa la verificación de seguridad.' })
    }
    const ip = getRequestIP(event, { xForwardedFor: true })
    const ok = await verifyTurnstileToken(token, turnstileSecret, ip)
    if (!ok) {
      throw createError({ statusCode: 403, message: 'Verificación de seguridad inválida.' })
    }
  }

  const origin = resolveSiteOrigin(event)
  const redirectUri = `${origin}/api/auth/google/callback`

  const state = randomBytes(32).toString('base64url')
  const opts = oauthCookieOpts(event)
  setCookie(event, 'oauth_state', state, opts)

  const rawReturn = typeof query.return === 'string' ? query.return : '/'
  const returnPath = safeReturnPath(rawReturn, '/')
  setCookie(event, OAUTH_RETURN_COOKIE, returnPath, opts)

  const scope = encodeURIComponent('openid email profile')
  const url =
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(config.googleClientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&access_type=offline&prompt=select_account` +
    `&scope=${scope}&state=${encodeURIComponent(state)}`

  return sendRedirect(event, url)
})
