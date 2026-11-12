import { proxyToLumiaApi } from '../../utils/lumia-api-client'

/** Permisos efectivos del usuario, calculados por el Server (RBAC). Sin sesión: lista vacía. */
export default defineEventHandler(async (event) => {
  const data = await proxyToLumiaApi(event, '/api/auth/permissions')
  if (getResponseStatus(event) !== 200) return { permissions: [] as string[] }
  const permissions = Array.isArray((data as { permissions?: unknown })?.permissions)
    ? (data as { permissions: unknown[] }).permissions.filter((p): p is string => typeof p === 'string')
    : []
  return { permissions }
})
