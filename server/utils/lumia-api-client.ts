import type { H3Event } from 'h3'

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

/** En Cloudflare Workers las vars de wrangler no siempre llegan a useRuntimeConfig(). */
function readWorkerEnv(name: string): string | undefined {
  const processEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  const fromProcess = processEnv?.[name]?.trim()
  if (fromProcess) return fromProcess

  const binding = (globalThis as { __env__?: Record<string, string | undefined> }).__env__?.[name]?.trim()
  if (binding) return binding

  return undefined
}

export function getLumiaApiBaseUrl(): string {
  const config = useRuntimeConfig()
  const base = config.apiBaseUrl?.trim() || readWorkerEnv('NUXT_API_BASE_URL')
  if (!base) {
    throw createError({
      statusCode: 503,
      message: 'NUXT_API_BASE_URL no configurada. El frontend requiere la API Lumia.',
    })
  }
  return normalizeBaseUrl(base)
}

function forwardRequestHeaders(event: H3Event): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' }

  const cookie = getHeader(event, 'cookie')
  if (cookie) headers.cookie = cookie

  const authorization = getHeader(event, 'authorization')
  if (authorization) headers.authorization = authorization

  const contentType = getHeader(event, 'content-type')
  if (contentType) headers['Content-Type'] = contentType

  for (const name of ['idempotency-key', 'x-cron-secret', 'x-request-id']) {
    const value = getHeader(event, name)
    if (value) headers[name] = value
  }

  return headers
}

function forwardSetCookies(event: H3Event, response: Response) {
  const setCookie = response.headers.getSetCookie?.()
  if (setCookie?.length) {
    for (const cookie of setCookie) appendHeader(event, 'set-cookie', cookie)
    return
  }
  const single = response.headers.get('set-cookie')
  if (single) appendHeader(event, 'set-cookie', single)
}

/** Proxy transparente hacia la API Lumia externa. */
export async function proxyToLumiaApi(event: H3Event, apiPath?: string) {
  const base = getLumiaApiBaseUrl()
  const incoming = getRequestURL(event)
  const path = apiPath ?? incoming.pathname
  const url = `${base}${path}${incoming.search}`

  const method = event.method.toUpperCase()
  const headers = forwardRequestHeaders(event)

  let body: BodyInit | undefined
  if (!['GET', 'HEAD'].includes(method)) {
    body = (await readRawBody(event, false)) ?? undefined
  }

  const response = await fetch(url, { method, headers, body, redirect: 'manual' })
  forwardSetCookies(event, response)

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location')
    if (location) return sendRedirect(event, location, response.status)
  }

  setResponseStatus(event, response.status)

  const contentType = response.headers.get('content-type') ?? ''
  const text = await response.text()

  if (!text) return null
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }
  return text
}

export function mapApiUserToAuthUser(data: unknown): { user: Record<string, unknown> | null } {
  const payload = data as { user?: Record<string, unknown> | null } | null
  const apiUser = payload?.user
  if (!apiUser) return { user: null }

  const email = typeof apiUser.email === 'string' ? apiUser.email : undefined
  const name = typeof apiUser.name === 'string' ? apiUser.name : undefined
  const nickname = typeof apiUser.nickname === 'string' ? apiUser.nickname : undefined
  const role = apiUser.role === 'admin' ? 'admin' : 'user'
  const prefs = apiUser.notificationPreferences as Record<string, boolean> | undefined

  return {
    user: {
      id: String(apiUser.id ?? ''),
      name: name ?? nickname ?? email?.split('@')[0] ?? 'Usuario',
      nickname,
      email,
      avatar: typeof apiUser.avatar === 'string' ? apiUser.avatar : undefined,
      role,
      notificationPreferences: prefs,
    },
  }
}

export async function lumiaApiFetch<T>(
  event: H3Event,
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    query?: Record<string, string | number | boolean | undefined>
    body?: unknown
  } = {},
): Promise<T> {
  const base = getLumiaApiBaseUrl()
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`

  try {
    return (await $fetch<T>(url, {
      method: options.method ?? 'GET',
      query: options.query,
      body: options.body as Record<string, unknown> | undefined,
      headers: {
        ...forwardRequestHeaders(event),
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      timeout: 20_000,
    })) as T
  } catch (e: unknown) {
    const err = e as { statusCode?: number; data?: { message?: string; code?: string } }
    const status = err.statusCode ?? 502
    throw createError({
      statusCode: status >= 400 && status < 600 ? status : 502,
      message: err.data?.message ?? 'Error al contactar la API Lumia',
      data: err.data,
    })
  }
}
