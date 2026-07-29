import { getSalesDb } from '../../database/sales'

const COL = 'user_favorites'
export const FAVORITES_MAX = 30
const TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface FavoriteEntity {
  userId: string
  productSlug: string
  createdAt: Date
  expiresAt: Date
}

export function createFavoritesRepository() {
  return {
    async purgeExpired(userId: string) {
      const db = await getSalesDb()
      const now = new Date()
      await db.collection(COL).deleteMany({ userId, expiresAt: { $lt: now } })
    },
    async listSlugs(userId: string): Promise<string[]> {
      const db = await getSalesDb()
      const now = new Date()
      await db.collection(COL).deleteMany({ userId, expiresAt: { $lt: now } })
      const rows = await db
        .collection<FavoriteEntity>(COL)
        .find({ userId, expiresAt: { $gte: now } })
        .sort({ createdAt: -1 })
        .toArray()
      return rows.map((r) => r.productSlug)
    },
    async has(userId: string, productSlug: string): Promise<boolean> {
      const db = await getSalesDb()
      const now = new Date()
      const n = await db.collection(COL).countDocuments({ userId, productSlug, expiresAt: { $gte: now } })
      return n > 0
    },
    async add(userId: string, productSlug: string) {
      const db = await getSalesDb()
      const now = new Date()
      await db.collection(COL).deleteMany({ userId, expiresAt: { $lt: now } })
      const count = await db.collection(COL).countDocuments({ userId, expiresAt: { $gte: now } })
      if (count >= FAVORITES_MAX) {
        throw new Error('FAVORITES_LIMIT')
      }
      const expiresAt = new Date(now.getTime() + TTL_MS)
      await db.collection(COL).updateOne(
        { userId, productSlug },
        { $set: { userId, productSlug, createdAt: now, expiresAt } },
        { upsert: true }
      )
    },
    async remove(userId: string, productSlug: string) {
      const db = await getSalesDb()
      await db.collection(COL).deleteOne({ userId, productSlug })
    },
    async mergeSlugs(userId: string, slugs: string[]) {
      const unique = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))]
      for (const slug of unique) {
        const exists = await this.has(userId, slug)
        if (exists) continue
        try {
          await this.add(userId, slug)
        } catch (e) {
          if ((e as Error)?.message === 'FAVORITES_LIMIT') break
          throw e
        }
      }
      return this.listSlugs(userId)
    },
  }
}
