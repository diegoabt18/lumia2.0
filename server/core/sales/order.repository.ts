import { ObjectId } from 'mongodb'
import type { OrderCheckoutShippingInput } from '#shared/schemas/order-checkout'
import type { CartItemDoc } from './cart.repository'
import type { StockReservationLine } from './stock-reservation'
import { getSalesDb } from '../../database/sales'

export type OrderStockReservationStatus = 'held' | 'released' | 'committed'

export interface OrderItemDoc {
  sku: string
  productSlug?: string
  name: string
  variantLabel?: string
  quantity: number
  unitPrice: number
  subtotal: number
  imagePath?: string | null
}

export interface OrderDoc {
  _id?: ObjectId
  orderNumber: string
  userId: string | null
  email: string | null
  customerName: string
  phone: string
  whatsapp?: string
  address: string
  city: string
  reference: string
  notes?: string
  items: OrderItemDoc[]
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  currency: string
  status: 'pending'
  paymentStatus: 'pending_manual'
  paymentMethod: 'manual'
  fulfillmentStatus: 'unfulfilled'
  source: 'cart'
  events: Array<{ type: string; timestamp: Date; source: string; data?: Record<string, unknown> }>
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
  stockReservations?: StockReservationLine[]
  stockReservationStatus?: OrderStockReservationStatus
}

function normalizeWhatsappDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

async function nextOrderNumber(prefix: string): Promise<string> {
  const db = await getSalesDb()
  const year = new Date().getFullYear()
  const counterId = `order-seq-${year}`
  const updated = await db.collection<{ _id: string; seq: number }>('counters').findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  )
  const seq = typeof updated?.seq === 'number' ? updated.seq : 1
  return `${prefix}-${year}-${String(seq).padStart(6, '0')}`
}

function mapItems(cartItems: CartItemDoc[]): OrderItemDoc[] {
  return cartItems.map((i) => ({
    sku: i.sku,
    productSlug: i.productSlug,
    name: i.productName,
    variantLabel: i.variantLabel,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    subtotal: i.unitPrice * i.quantity,
    imagePath: i.imagePath ?? null,
  }))
}

export async function createManualOrder(input: {
  cartItems: CartItemDoc[]
  shipping: OrderCheckoutShippingInput
  userId: string | null
  email: string | null
  orderNumberPrefix: string
  defaultCurrency: string
  manualPaymentTtlHours: number
  shippingCost: number
  stockReservations?: StockReservationLine[]
}): Promise<{ id: string; orderNumber: string; total: number; currency: string }> {
  if (!input.cartItems.length) throw new Error('CART_EMPTY')

  const items = mapItems(input.cartItems)
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
  const shippingCost = Math.max(0, input.shippingCost)
  const tax = 0
  const total = subtotal + shippingCost + tax
  const currency = input.cartItems.find((i) => i.currency)?.currency ?? input.defaultCurrency
  const orderNumber = await nextOrderNumber(input.orderNumberPrefix)
  const now = new Date()
  const notes = input.shipping.notes?.trim()

  const doc: OrderDoc = {
    orderNumber,
    userId: input.userId,
    email: input.email,
    customerName: input.shipping.customerName.trim(),
    phone: input.shipping.phone.trim(),
    whatsapp: normalizeWhatsappDigits(input.shipping.phone),
    address: input.shipping.address.trim(),
    city: input.shipping.city.trim(),
    reference: input.shipping.reference.trim(),
    ...(notes ? { notes } : {}),
    items,
    subtotal,
    shippingCost,
    tax,
    total,
    currency,
    status: 'pending',
    paymentStatus: 'pending_manual',
    paymentMethod: 'manual',
    fulfillmentStatus: 'unfulfilled',
    source: 'cart',
    events: [
      { type: 'order.created', timestamp: now, source: 'system', data: { total, currency, itemCount: items.length } },
      { type: 'payment.manual_pending', timestamp: now, source: 'system', data: { paymentMethod: 'manual' } },
    ],
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + input.manualPaymentTtlHours * 60 * 60 * 1000),
    ...(input.stockReservations?.length
      ? {
          stockReservations: input.stockReservations,
          stockReservationStatus: 'held' as OrderStockReservationStatus,
        }
      : {}),
  }

  const db = await getSalesDb()
  const result = await db.collection<OrderDoc>('orders').insertOne(doc)
  return {
    id: result.insertedId.toString(),
    orderNumber,
    total,
    currency,
  }
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderDoc | null> {
  const db = await getSalesDb()
  return db.collection<OrderDoc>('orders').findOne({ orderNumber })
}

export async function getOrderByIdForUser(orderId: string, userId: string): Promise<OrderDoc | null> {
  if (!ObjectId.isValid(orderId)) return null
  const db = await getSalesDb()
  return db.collection<OrderDoc>('orders').findOne({
    _id: new ObjectId(orderId),
    userId,
  })
}

export async function listOrdersByUserId(userId: string, limit = 20): Promise<OrderDoc[]> {
  const db = await getSalesDb()
  return db
    .collection<OrderDoc>('orders')
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
}

export function toPublicOrder(order: OrderDoc) {
  return {
    id: order._id?.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    total: order.total,
    currency: order.currency,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    address: order.address,
    city: order.city,
    reference: order.reference,
    notes: order.notes,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    items: order.items.map((i) => ({
      sku: i.sku,
      name: i.name,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    })),
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
  }
}
