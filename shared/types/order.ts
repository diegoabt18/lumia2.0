export interface OrderItem {
  sku: string
  productSlug?: string
  name: string
  variantLabel?: string
  quantity: number
  unitPrice: number
  subtotal: number
  imagePath?: string | null
}

export interface OrderSummary {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod?: string
  total: number
  currency: string
  customerName: string
  phone: string
  email?: string | null
  address: string
  city: string
  reference: string
  notes?: string
  subtotal: number
  shippingCost: number
  items: OrderItem[]
  createdAt: string
  cancellationRequested?: boolean
  cancellationRequestStatus?: string
}
