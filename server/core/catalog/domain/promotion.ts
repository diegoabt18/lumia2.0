import type { ObjectId } from 'mongodb'

export interface PromotionProductEntry {
  product_slug: string
  percent_off: number | null
}

export interface PromotionEntity {
  _id?: ObjectId
  name: string
  description?: string
  active: boolean
  starts_at: Date
  ends_at: Date
  priority: number
  apply_general_discount?: boolean
  general_percent_off?: number
  category_slugs?: string[]
  product_entries?: PromotionProductEntry[]
  scope?: 'global' | 'products'
  global_percent_off?: number
  product_percents?: Record<string, number>
}
