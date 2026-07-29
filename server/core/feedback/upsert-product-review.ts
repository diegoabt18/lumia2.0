function sanitizeText(input: unknown, max = 2000): string {
  const raw = String(input ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return raw.slice(0, max)
}

async function isVerifiedPurchase(productSlug: string, userId: string): Promise<boolean> {
  const { getSalesDb } = await import('../../database/sales')
  const db = await getSalesDb()
  const found = await db.collection('orders').findOne({
    userId,
    'items.productSlug': productSlug,
  })
  return Boolean(found)
}

async function refreshProductRating(productSlug: string): Promise<void> {
  const { getSalesDb } = await import('../../database/sales')
  const { getCatalogDb, isCatalogDbConfigured } = await import('../../database/catalog')
  const salesDb = await getSalesDb()
  const agg = await salesDb
    .collection('product_reviews')
    .aggregate([
      { $match: { product_slug: productSlug, hidden: { $ne: true } } },
      { $group: { _id: null, average: { $avg: '$stars' }, count: { $sum: 1 } } },
    ])
    .toArray()
  const average = Math.round(((agg[0]?.average ?? 0) as number) * 10) / 10
  const count = Number(agg[0]?.count ?? 0)
  if (!isCatalogDbConfigured()) return
  const catDb = await getCatalogDb()
  await catDb.collection('products').updateOne(
    { slug: productSlug },
    { $set: { average_rating: average, reviews_count: count, updated_at: new Date() } }
  )
}

export async function upsertProductReview(input: {
  productSlug: string
  userId: string
  userName: string
  userAvatar?: string
  stars: number
  title?: string
  body: string
}): Promise<{ ok: true }> {
  const { getSalesDb } = await import('../../database/sales')
  const db = await getSalesDb()
  const now = new Date()
  const verified = await isVerifiedPurchase(input.productSlug, input.userId)
  const stars = Math.min(5, Math.max(1, Math.round(input.stars)))

  await db.collection('product_reviews').updateOne(
    { product_slug: input.productSlug, user_id: input.userId },
    {
      $set: {
        product_slug: input.productSlug,
        user_id: input.userId,
        user_name: sanitizeText(input.userName, 120),
        user_avatar: sanitizeText(input.userAvatar, 1000),
        stars,
        title: sanitizeText(input.title, 200),
        body: sanitizeText(input.body, 4000),
        verified_purchase: verified,
        updated_at: now,
      },
      $setOnInsert: {
        created_at: now,
        helpful_count: 0,
        not_helpful_count: 0,
        hidden: false,
      },
    },
    { upsert: true }
  )

  await refreshProductRating(input.productSlug)
  return { ok: true }
}
