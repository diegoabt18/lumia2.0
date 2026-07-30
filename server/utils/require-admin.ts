import { createError, type H3Event } from 'h3'
import { mapApiUserToAuthUser, proxyToLumiaApi } from './lumia-api-client'

export async function requireAdmin(event: H3Event) {
  const data = await proxyToLumiaApi(event, '/api/auth/me')
  const { user } = mapApiUserToAuthUser(data)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Inicia sesión para continuar' })
  }
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Se requiere rol admin' })
  }
  return user
}
