export interface PosPaymentMethod {
  methodId: string
  displayName: string
  description: string
  supportsPaid: boolean
}

export interface PosProductVariant {
  sku: string
  label: string
  barcode: string | null
  price: number
  originalPrice: number
  promotionPercentOff?: number
  currency: string
  stock: number
  available: number
  tracked: boolean
  isPerOrder: boolean
}

export interface PosProduct {
  id: string
  slug: string
  name: string
  imagePath: string | null
  variants: PosProductVariant[]
}

export interface PosCustomer {
  id: string
  name: string
  email: string | null
  phone: string | null
}

export interface PosSaleItem {
  sku: string
  quantity: number
}

export interface PosCartItem {
  sku: string
  productId: string
  productSlug: string
  name: string
  variantLabel?: string
  imageUrl?: string | null
  unitPrice: number
  originalUnitPrice: number
  quantity: number
  currency: string
  tracked: boolean
  isPerOrder: boolean
}

export interface PosSaleView {
  id: string
  orderNumber: string
  receiptNumber: string
  channel: string
  fulfillment: string
  status: string
  paymentStatus: string
  fulfillmentStatus: string
  paymentMethod: string
  cashReceived?: number | null
  changeGiven?: number | null
  transferReference?: string | null
  paymentConfirmedByUserId?: string | null
  paymentConfirmedAt?: string | null
  customerName: string
  phone: string
  email: string | null
  subtotal: number
  discountAmount: number
  tax: number
  total: number
  currency: string
  createdAt: string
  items: Array<{
    sku?: string
    variantSku?: string
    name: string
    variantName?: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
}

export interface PosSaleResult {
  order: PosSaleView
  receiptUrl: string
  replayed: boolean
}