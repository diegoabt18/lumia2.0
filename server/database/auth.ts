import { getMongoDb, resolveDbName } from '../database/connection'

export interface UserDoc {
  _id?: { toString(): string }
  google_id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'admin'
  created_at?: Date
  updated_at?: Date
}

function toUser(doc: UserDoc, fallbackGoogleId: string) {
  return {
    id: doc._id?.toString?.() ?? fallbackGoogleId,
    email: doc.email,
    name: doc.name,
    avatar: doc.avatar,
    role: doc.role ?? ('user' as const),
  }
}

export async function getAuthDb() {
  const config = useRuntimeConfig()
  const uri = config.mongoAuthUri?.trim()
  if (!uri) {
    throw createError({ statusCode: 503, message: 'MongoDB auth no configurado' })
  }
  return getMongoDb(uri, resolveDbName(uri, 'identity_db'))
}

export function isAuthDbConfigured(): boolean {
  const config = useRuntimeConfig()
  return Boolean(config.mongoAuthUri?.trim())
}

/**
 * Vincula o actualiza usuario Google.
 * - google_id es la identidad primaria (única).
 * - email tiene índice único: no se reasigna google_id si el email ya pertenece a otro.
 */
export async function upsertGoogleUser(input: {
  googleId: string
  email: string
  name: string
  avatar?: string
}): Promise<{ id: string; email: string; name: string; avatar?: string; role: 'user' | 'admin' }> {
  const db = await getAuthDb()
  const now = new Date()
  const coll = db.collection<UserDoc>('users')

  const byGoogleId = await coll.findOne({ google_id: input.googleId })
  if (byGoogleId?._id) {
    await coll.updateOne(
      { _id: byGoogleId._id },
      {
        $set: {
          email: input.email,
          name: input.name,
          avatar: input.avatar,
          updated_at: now,
        },
      }
    )
    const doc = await coll.findOne({ _id: byGoogleId._id })
    if (!doc) throw createError({ statusCode: 500, message: 'No se pudo actualizar usuario' })
    return toUser(doc, input.googleId)
  }

  const byEmail = await coll.findOne({ email: input.email })
  if (byEmail?._id) {
    const storedGoogleId = byEmail.google_id?.trim()
    if (storedGoogleId && storedGoogleId !== input.googleId) {
      console.warn('[auth] email/google_id conflict', {
        email: input.email,
        storedGoogleId,
        incomingGoogleId: input.googleId,
      })
      throw createError({
        statusCode: 409,
        message: 'email_google_conflict',
      })
    }

    // Legacy: registro previo solo por email → vincular Google una vez
    await coll.updateOne(
      { _id: byEmail._id },
      {
        $set: {
          google_id: input.googleId,
          name: input.name,
          avatar: input.avatar,
          updated_at: now,
        },
      }
    )
    const doc = await coll.findOne({ _id: byEmail._id })
    if (!doc) throw createError({ statusCode: 500, message: 'No se pudo vincular usuario' })
    return toUser(doc, input.googleId)
  }

  await coll.insertOne({
    google_id: input.googleId,
    email: input.email,
    name: input.name,
    avatar: input.avatar,
    role: 'user',
    created_at: now,
    updated_at: now,
  })

  const doc = await coll.findOne({ google_id: input.googleId })
  if (!doc) {
    console.error('[auth] upsertGoogleUser insert failed', { googleId: input.googleId, email: input.email })
    throw createError({ statusCode: 500, message: 'No se pudo crear usuario' })
  }

  return toUser(doc, input.googleId)
}

export async function getUserById(userId: string): Promise<UserDoc | null> {
  const db = await getAuthDb()
  const { ObjectId } = await import('mongodb')
  const filter = ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { google_id: userId }
  return db.collection<UserDoc>('users').findOne(filter as Record<string, unknown>)
}
