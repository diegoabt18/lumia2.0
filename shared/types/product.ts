export interface ProductVariant {
  id: string
  productSlug: string
  sku: string
  options: Record<string, string>
  price: number
  compareAtPrice?: number
  salePrice?: number
  currency?: string
  quantity?: number
  stock?: number
  available?: number
  imagePath?: string | null
  promotionPercentOff?: number
  promotionLabel?: string
  promotionEndsAt?: string
  originalPrice?: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  fromPrice?: number
  currency?: string
  categorySlug?: string
  imagePath?: string | null
  createdAt?: string
  variants?: ProductVariant[]
  salesBadge?: 'bestseller' | 'popular' | null
  averageRating?: number
  reviewsCount?: number
}

export interface CartItem {
  sku: string
  productSlug: string
  productName: string
  quantity: number
  unitPrice: number
  currency: string
  imagePath?: string | null
}
