export type ProductFeedbackReview = {
  id: string
  userName: string
  userAvatar: string
  stars: number
  title: string
  body: string
  verifiedPurchase: boolean
  helpfulCount: number
  createdAt: string | Date
}

export type ProductFeedbackResult = {
  rating: {
    average: number
    count: number
    distribution: Array<{ stars: number; count: number }>
  }
  reviews: ProductFeedbackReview[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export async function listProductFeedbackReadOnly(
  productSlug: string,
  page = 1,
  limit = 8
): Promise<ProductFeedbackResult> {
  const { getSalesDb } = await import('../../database/sales')
  const db = await getSalesDb()
  const safeLimit = Math.min(20, Math.max(1, limit))
  const safePage = Math.max(1, page)
  const skip = (safePage - 1) * safeLimit

  const match = { product_slug: productSlug, hidden: { $ne: true } }

  const [distributionRows, total, reviews] = await Promise.all([
    db
      .collection('product_reviews')
      .aggregate([{ $match: match }, { $group: { _id: '$stars', count: { $sum: 1 } } }])
      .toArray(),
    db.collection('product_reviews').countDocuments(match),
    db
      .collection('product_reviews')
      .find(match)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(safeLimit)
      .project({
        user_name: 1,
        user_avatar: 1,
        stars: 1,
        title: 1,
        body: 1,
        verified_purchase: 1,
        helpful_count: 1,
        created_at: 1,
      })
      .toArray(),
  ])

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: Number(distributionRows.find((x) => Number(x._id) === stars)?.count ?? 0),
  }))
  const count = distribution.reduce((acc, x) => acc + x.count, 0)
  const average =
    count > 0
      ? Math.round((distribution.reduce((acc, x) => acc + x.stars * x.count, 0) / count) * 10) / 10
      : 0

  return {
    rating: { average, count, distribution },
    reviews: reviews.map((r) => ({
      id: String(r._id),
      userName: String(r.user_name ?? 'Cliente'),
      userAvatar: typeof r.user_avatar === 'string' ? r.user_avatar : '',
      stars: Number(r.stars ?? 0),
      title: String(r.title ?? ''),
      body: String(r.body ?? ''),
      verifiedPurchase: Boolean(r.verified_purchase),
      helpfulCount: Number(r.helpful_count ?? 0),
      createdAt: r.created_at ?? new Date(),
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  }
}
