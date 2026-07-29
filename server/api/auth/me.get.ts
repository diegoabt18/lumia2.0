import { getUserById } from '../../database/auth'
import { getSessionFromEvent } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSessionFromEvent(event)
  if (!session) return { user: null }

  try {
    const doc = await getUserById(session.userId)
    if (!doc) return { user: null }
    return {
      user: {
        id: doc._id?.toString?.() ?? session.userId,
        name: doc.name,
        email: doc.email,
        avatar: doc.avatar,
        role: doc.role ?? session.role,
      },
    }
  } catch {
    return {
      user: {
        id: session.userId,
        name: session.email.split('@')[0] ?? 'Usuario',
        email: session.email,
        role: session.role,
      },
    }
  }
})
