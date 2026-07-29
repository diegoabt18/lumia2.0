import { getMongoDb, resolveDbName } from '../database/connection'

export interface UserDoc {
  _id?: { toString(): string }
  google_id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'admin'
  created_at?: Date
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

export async function upsertGoogleUser(input: {
  googleId: string
  email: string
  name: string
  avatar?: string
}): Promise<{ id: string; email: string; name: string; avatar?: string; role: 'user' | 'admin' }> {
  const db = await getAuthDb()
  const now = new Date()
  const coll = db.collection<UserDoc>('users')

  await coll.updateOne(
    { google_id: input.googleId },
    {
      $set: {
        email: input.email,
        name: input.name,
        avatar: input.avatar,
        updated_at: now,
      },
      $setOnInsert: {
        google_id: input.googleId,
        role: 'user',
        created_at: now,
      },
    },
    { upsert: true }
  )

  let doc = await coll.findOne({ google_id: input.googleId })

  // Usuario previo creado solo por email u otro google_id
  if (!doc) {
    doc = await coll.findOneAndUpdate(
      { email: input.email },
      {
        $set: {
          google_id: input.googleId,
          name: input.name,
          avatar: input.avatar,
          updated_at: now,
        },
        $setOnInsert: {
          role: 'user',
          created_at: now,
        },
      },
      { upsert: true, returnDocument: 'after' }
    )
  }

  if (!doc) {
    console.error('[auth] upsertGoogleUser failed', { googleId: input.googleId, email: input.email })
    throw createError({ statusCode: 500, message: 'No se pudo crear usuario' })
  }

  return {
    id: doc._id?.toString?.() ?? input.googleId,
    email: doc.email,
    name: doc.name,
    avatar: doc.avatar,
    role: doc.role ?? 'user',
  }
}

export async function getUserById(userId: string): Promise<UserDoc | null> {
  const db = await getAuthDb()
  const { ObjectId } = await import('mongodb')
  const filter = ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { google_id: userId }
  return db.collection<UserDoc>('users').findOne(filter as Record<string, unknown>)
}
