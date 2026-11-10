/** POS payment method identifiers (distinct from payment status). */
export type PosPaymentMethodId = 'cash' | 'bank_transfer'

/** POS payment statuses (distinct from payment method). */
export type PosPaymentStatus = 'pending_manual' | 'paid'

export interface PosPaymentMethod {
  methodId: string
  displayName: string
  description: string
  /** When false, sales using this method must start as pending_manual. */
  supportsPaid: boolean
}

export interface PosBankTransferDetails {
  bankName: string
  accountNumber: string
  accountHolder: string
  taxId?: string
  instructions?: string
}

export interface PosPaymentConfig {
  methods: PosPaymentMethod[]
  bankTransferDetails: PosBankTransferDetails | null
}

export interface PosPaymentEvent {
  type: string
  timestamp: string
  actorId?: string | null
  data?: Record<string, unknown>
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

export interface PosProductSearchResult {
  products: PosProduct[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PosCustomer {
  id: string
  name: string
  email: string | null
  phone: string | null
  /** 'counter' = cliente de mostrador (sin cuenta web). */
  source?: 'account' | 'counter'
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
  /** Stock snapshot taken when the line was added; the server re-validates on submit. */
  available: number
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
  /** Pago inicial, pagado y saldo (G3). */
  initialPaymentRequired?: number
  paidAmount?: number
  balanceDue?: number
  /** Importe exacto que se cobra ahora (anticipo pendiente o saldo completo). */
  nextPaymentRequired?: number
  cashReceived?: number | null
  changeGiven?: number | null
  transferReference?: string | null
  paymentConfirmedByUserId?: string | null
  paymentConfirmedAt?: string | null
  paymentEvents?: PosPaymentEvent[]
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
