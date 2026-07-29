import { isAuthDbConfigured, upsertGoogleUser } from '../../../database/auth'
import { isSalesDbConfigured } from '../../../database/sales'
import { mergeGuestCartIntoUser } from '../../../core/sales/cart.repository'
import { resolveSiteOrigin } from '../../../utils/cookie-domain'
import { clearGuestCartCookie, getGuestCartKeyFromEvent } from '../../../utils/guest-cart-cookie'
import {
  oauthCookieOpts,
  safeReturnPath,
  setSessionCookie,
  signSessionToken,
  verifyGoogleIdToken,
} from '../../../utils/session'

const OAUTH_RETURN_COOKIE = 'oauth_return'

async function exchangeCodeForIdToken(code: string, redirectUri: string, clientId: string, clientSecret: string) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    console.warn('[oauth] token exchange failed', res.status, await res.text().catch(() => ''))
    return null
  }
  const json = (await res.json()) as { id_token?: string }
  return json.id_token ?? null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const origin = resolveSiteOrigin(event)
  const redirectUri = `${origin}/api/auth/google/callback`

  const query = getQuery(event)
  const oauthError = typeof query.error === 'string' ? query.error : undefined
  if (oauthError) {
    return sendRedirect(event, `${origin}/auth/login?error=${encodeURIComponent(oauthError)}`)
  }

  const code = typeof query.code === 'string' ? query.code : undefined
  const qState = typeof query.state === 'string' ? query.state : undefined
  if (!code) {
    return sendRedirect(event, `${origin}/api/auth/google`)
  }

  if (!config.googleClientId || !config.googleClientSecret || !config.jwtSecret) {
    return sendRedirect(event, `${origin}/auth/login?error=google_config`)
  }
  if (!isAuthDbConfigured()) {
    return sendRedirect(event, `${origin}/auth/login?error=auth_db`)
  }

  const cookieState = getCookie(event, 'oauth_state')
  const storedReturnPath = safeReturnPath(getCookie(event, OAUTH_RETURN_COOKIE), '/')
  const del = oauthCookieOpts(event)
  deleteCookie(event, 'oauth_state', {
    path: del.path,
    sameSite: del.sameSite,
    secure: del.secure,
    ...(del.domain ? { domain: del.domain } : {}),
  })
  deleteCookie(event, OAUTH_RETURN_COOKIE, {
    path: del.path,
    sameSite: del.sameSite,
    secure: del.secure,
    ...(del.domain ? { domain: del.domain } : {}),
  })

  if (!cookieState || !qState || cookieState !== qState) {
    return sendRedirect(event, `${origin}/auth/login?error=oauth_state`)
  }

  try {
    const idToken = await exchangeCodeForIdToken(code, redirectUri, config.googleClientId, config.googleClientSecret)
    if (!idToken) {
      return sendRedirect(event, `${origin}/auth/login?error=google_token`)
    }

    const googleUser = await verifyGoogleIdToken(idToken, config.googleClientId)
    if (!googleUser) {
      return sendRedirect(event, `${origin}/auth/login?error=google_user`)
    }

    const user = await upsertGoogleUser(googleUser)
    const sessionToken = await signSessionToken(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret
    )
    setSessionCookie(event, sessionToken)

    const guestKey = getGuestCartKeyFromEvent(event)
    if (guestKey && isSalesDbConfigured()) {
      try {
        await mergeGuestCartIntoUser(guestKey, user.id)
      } catch (e) {
        console.warn('[oauth] merge guest cart failed', (e as Error)?.message)
      }
      clearGuestCartCookie(event)
    }

    return sendRedirect(event, `${origin}${storedReturnPath}`)
  } catch (e) {
    console.error('[oauth] callback failed', e)
    return sendRedirect(event, `${origin}/auth/login?error=oauth_server`)
  }
})
