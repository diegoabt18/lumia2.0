export interface ProductOptionValueRef {
  id: string
  value: string
  slug: string
  position: number
}

export interface ProductOptionAxisDTO {
  id: string
  name: string
  position: number
  values: ProductOptionValueRef[]
}

export interface VariantOptionRule {
  optionId: string
  allowedValueIds: string[]
}

export interface ProductVariant {
  id: string
  productSlug: string
  sku: string
  options: Record<string, string>
  optionRules?: VariantOptionRule[]
  price: number
  compareAtPrice?: number
  salePrice?: number
  currency?: string
  quantity?: number
  stock?: number
  available?: number
  imagePath?: string | null
  isMadeToOrder?: boolean
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
  options?: Array<{ name: string; values: string[] }>
  optionAxes?: ProductOptionAxisDTO[] | null
  optionsFormat?: 'normalized' | 'legacy'
  salesBadge?: 'bestseller' | 'popular' | null
  averageRating?: number
  reviewsCount?: number
}

export interface CartItem {
  sku: string
  productSlug: string
  productName: string
  /** Opciones legibles de la variante (ej. "200g · Lavanda"). */
  variantLabel?: string
  quantity: number
  unitPrice: number
  currency: string
  imagePath?: string | null
}
