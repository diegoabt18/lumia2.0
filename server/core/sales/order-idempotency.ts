import { getSalesDb } from '../../database/sales'

const COL = 'order_idempotency'
const TTL_MS = 24 * 60 * 60 * 1000

export interface IdempotentOrderResponse {
  orderId: string
  orderNumber: string
  total: number
  currency: string
  paymentStatus: string
  paymentMethod: string
  instructions: string
  accessToken: string
}

interface IdempotencyDoc {
  _id: string
  cartKey: string
  response: IdempotentOrderResponse
  createdAt: Date
  expiresAt: Date
}

export async function findIdempotentOrder(
  key: string,
  cartKey: string
): Promise<IdempotentOrderResponse | null> {
  const db = await getSalesDb()
  const now = new Date()
  await db.collection(COL).deleteMany({ expiresAt: { $lt: now } })
  const row = await db.collection<IdempotencyDoc>(COL).findOne({
    _id: key,
    cartKey,
    expiresAt: { $gte: now },
  })
  return row?.response ?? null
}

export async function saveIdempotentOrder(
  key: string,
  cartKey: string,
  response: IdempotentOrderResponse
): Promise<boolean> {
  const db = await getSalesDb()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + TTL_MS)
  try {
    await db.collection(COL).insertOne({
      _id: key,
      cartKey,
      response,
      createdAt: now,
      expiresAt,
    })
    return true
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code
    if (code === 11000) return false
    throw e
  }
}
