import { createError, type H3Event } from 'h3'
import { getSessionFromEvent, type SessionPayload } from './session'

export async function requireAdmin(event: H3Event): Promise<SessionPayload> {
  const session = await getSessionFromEvent(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Inicia sesión para continuar' })
  }
  if (session.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Se requiere rol admin' })
  }
  return session
}
