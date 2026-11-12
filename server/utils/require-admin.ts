import { createError, type H3Event } from 'h3'
import { mapApiUserToAuthUser, proxyToLumiaApi } from './lumia-api-client'

/** Exige sesión y el permiso admin.access (RBAC del Server). */
export async function requireAdmin(event: H3Event) {
  const data = await proxyToLumiaApi(event, '/api/auth/me')
  const { user } = mapApiUserToAuthUser(data)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Inicia sesión para continuar' })
  }
  const perms = await proxyToLumiaApi(event, '/api/auth/permissions')
  const list = (perms as { permissions?: unknown })?.permissions
  const keys = Array.isArray(list) ? list.filter((p): p is string => typeof p === 'string') : []
  if (!keys.includes('admin.access') && !keys.includes('*')) {
    throw createError({ statusCode: 403, message: 'Se requiere el permiso admin.access' })
  }
  return user
}
