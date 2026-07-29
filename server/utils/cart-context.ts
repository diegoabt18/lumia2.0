import type { H3Event } from 'h3'
import { ensureGuestCartKey, getGuestCartKeyFromEvent } from './guest-cart-cookie'
import { getSessionFromEvent } from './session'

export type CartSubject = { cartKey: string; kind: 'user' | 'guest' }

export async function resolveCartSubjectForRead(event: H3Event): Promise<CartSubject | null> {
  const session = await getSessionFromEvent(event)
  if (session) return { cartKey: session.userId, kind: 'user' }
  const guestKey = getGuestCartKeyFromEvent(event)
  if (!guestKey) return null
  return { cartKey: guestKey, kind: 'guest' }
}

export async function resolveCartSubjectForWrite(event: H3Event): Promise<CartSubject | null> {
  const session = await getSessionFromEvent(event)
  if (session) return { cartKey: session.userId, kind: 'user' }
  return { cartKey: ensureGuestCartKey(event), kind: 'guest' }
}
