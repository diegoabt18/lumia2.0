import { getSessionFromEvent } from '../../utils/session'

/** Solo lee la cookie JWT — sin MongoDB (evita cuelgues del pool en Cloudflare Workers). */
export default defineEventHandler(async (event) => {
  const session = await getSessionFromEvent(event)
  if (!session) return { user: null }

  return {
    user: {
      id: session.userId,
      name: session.name ?? session.email.split('@')[0] ?? 'Usuario',
      email: session.email,
      avatar: session.avatar,
      role: session.role,
    },
  }
})
