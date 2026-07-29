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
