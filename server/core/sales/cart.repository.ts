import type { CartItem } from '#shared/types/product'
import { getSalesDb } from '../../database/sales'

export interface CartItemDoc {
  sku: string
  productSlug: string
  productName: string
  quantity: number
  unitPrice: number
  currency: string
  imagePath?: string | null
}

export interface CartDoc {
  userId: string
  items: CartItemDoc[]
  updatedAt: Date
}

function mapItem(doc: CartItemDoc): CartItem {
  return {
    sku: doc.sku,
    productSlug: doc.productSlug,
    productName: doc.productName,
    quantity: doc.quantity,
    unitPrice: doc.unitPrice,
    currency: doc.currency,
    imagePath: doc.imagePath ?? null,
  }
}

export async function getCartItems(cartKey: string): Promise<CartItem[]> {
  const db = await getSalesDb()
  const cart = await db.collection<CartDoc>('carts').findOne({ userId: cartKey })
  return (cart?.items ?? []).map(mapItem)
}

export async function addCartItem(
  cartKey: string,
  input: Omit<CartItemDoc, 'quantity'> & { quantity: number }
) {
  const db = await getSalesDb()
  const cart = await db.collection<CartDoc>('carts').findOne({ userId: cartKey })
  const items = [...(cart?.items ?? [])]
  const idx = items.findIndex((i) => i.sku === input.sku)
  const line: CartItemDoc = {
    sku: input.sku,
    productSlug: input.productSlug,
    productName: input.productName,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    currency: input.currency,
    imagePath: input.imagePath ?? null,
  }
  if (idx >= 0) {
    const existing = items[idx]
    if (existing) existing.quantity += input.quantity
  } else items.push(line)
  await db.collection('carts').updateOne(
    { userId: cartKey },
    { $set: { items, updatedAt: new Date() } },
    { upsert: true }
  )
}

export async function setCartLineQuantity(cartKey: string, sku: string, quantity: number) {
  if (quantity <= 0) return removeCartItem(cartKey, sku)
  const db = await getSalesDb()
  const cart = await db.collection<CartDoc>('carts').findOne({ userId: cartKey })
  if (!cart) return
  const items = cart.items.map((i) => (i.sku === sku ? { ...i, quantity } : i))
  await db.collection('carts').updateOne({ userId: cartKey }, { $set: { items, updatedAt: new Date() } })
}

export async function removeCartItem(cartKey: string, sku: string) {
  const db = await getSalesDb()
  const cart = await db.collection<CartDoc>('carts').findOne({ userId: cartKey })
  if (!cart) return
  const items = cart.items.filter((i) => i.sku !== sku)
  await db.collection('carts').updateOne({ userId: cartKey }, { $set: { items, updatedAt: new Date() } })
}

export async function mergeGuestCartIntoUser(guestKey: string, userId: string) {
  const db = await getSalesDb()
  const guest = await db.collection<CartDoc>('carts').findOne({ userId: guestKey })
  if (!guest?.items?.length) return
  const user = await db.collection<CartDoc>('carts').findOne({ userId })
  const merged = [...(user?.items ?? [])]
  for (const item of guest.items) {
    const idx = merged.findIndex((i) => i.sku === item.sku)
    if (idx >= 0) {
      const line = merged[idx]
      if (line) line.quantity += item.quantity
    } else merged.push(item)
  }
  await db.collection('carts').updateOne(
    { userId },
    { $set: { items: merged, updatedAt: new Date() } },
    { upsert: true }
  )
  await db.collection('carts').updateOne({ userId: guestKey }, { $set: { items: [], updatedAt: new Date() } })
}

export function cartResponse(items: CartItem[]) {
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  return { items, total }
}

export async function clearCart(cartKey: string) {
  const db = await getSalesDb()
  await db.collection('carts').updateOne(
    { userId: cartKey },
    { $set: { items: [], updatedAt: new Date() } },
    { upsert: true }
  )
}
