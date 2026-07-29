import { randomBytes } from 'node:crypto'
import { isAuthDbConfigured } from '../../database/auth'
import { oauthCookieOpts, safeReturnPath } from '../../utils/session'

const OAUTH_RETURN_COOKIE = 'oauth_return'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.googleClientId?.trim()) {
    throw createError({ statusCode: 500, message: 'Google OAuth no configurado' })
  }
  if (!isAuthDbConfigured()) {
    throw createError({ statusCode: 503, message: 'MongoDB auth no configurado' })
  }

  const requestUrl = getRequestURL(event)
  const origin = config.siteUrl?.trim() ? config.siteUrl.replace(/\/$/, '') : requestUrl.origin
  const redirectUri = `${origin}/api/auth/google/callback`

  const query = getQuery(event)
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
