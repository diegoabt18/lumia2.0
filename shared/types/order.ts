export interface OrderItem {
  sku: string
  productSlug?: string
  name: string
  variantLabel?: string
  quantity: number
  unitPrice: number
  subtotal: number
  imagePath?: string | null
  /** Modalidad fotografiada por Server en la compra (G3). Ausente en pedidos antiguos. */
  fulfillmentMode?: 'stock' | 'made_to_order'
  initialPaymentRequired?: number
  paidAmount?: number
  balanceDue?: number
}

export interface OrderSummary {
  id: string
  orderNumber: string
  /** Referencia corta que ve el cliente (ORD-XXXXXXXX). */
  customerReference?: string
  status: string
  paymentStatus: string
  paymentMethod?: string
  total: number
  /** Pago inicial exigido por el pedido (G3). */
  initialPaymentRequired?: number
  /** Importe confirmado como pagado (G3). */
  paidAmount?: number
  /** Saldo pendiente (G3). */
  balanceDue?: number
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
