import type { CartItem } from '#shared/types/product'
import { getSalesDb } from '../../database/sales'

export interface CartItemDoc {
  sku: string
  productSlug: string
  productName: string
  variantLabel?: string
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
    variantLabel: doc.variantLabel,
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

/** Incrementa qty si existe la SKU; si no, agrega línea (operadores atómicos Mongo). */
export async function addCartItem(
  cartKey: string,
  input: Omit<CartItemDoc, 'quantity'> & { quantity: number }
) {
  const db = await getSalesDb()
  const now = new Date()
  const line: CartItemDoc = {
    sku: input.sku,
    productSlug: input.productSlug,
    productName: input.productName,
    variantLabel: input.variantLabel,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    currency: input.currency,
    imagePath: input.imagePath ?? null,
  }

  const inc = await db.collection('carts').updateOne(
    { userId: cartKey, 'items.sku': input.sku },
    {
      $inc: { 'items.$.quantity': input.quantity },
      $set: { updatedAt: now },
    }
  )

  if (inc.matchedCount > 0) return

  const push = await db.collection('carts').updateOne(
    { userId: cartKey, 'items.sku': { $ne: input.sku } },
    {
      $push: { items: line },
      $set: { updatedAt: now },
      $setOnInsert: { userId: cartKey },
    },
    { upsert: true }
  )

  if (push.matchedCount === 0 && push.upsertedCount === 0) {
    await db.collection('carts').updateOne(
      { userId: cartKey, 'items.sku': input.sku },
      {
        $inc: { 'items.$.quantity': input.quantity },
        $set: { updatedAt: now },
      }
    )
  }
}

export async function setCartLineQuantity(cartKey: string, sku: string, quantity: number) {
  if (quantity <= 0) return removeCartItem(cartKey, sku)
  const db = await getSalesDb()
  await db.collection('carts').updateOne(
    { userId: cartKey, 'items.sku': sku },
    { $set: { 'items.$.quantity': quantity, updatedAt: new Date() } }
  )
}

export async function removeCartItem(cartKey: string, sku: string) {
  const db = await getSalesDb()
  await db.collection('carts').updateOne(
    { userId: cartKey },
    { $pull: { items: { sku } }, $set: { updatedAt: new Date() } }
  )
}

/** Fusiona carrito invitado reutilizando addCartItem atómico por línea. */
export async function mergeGuestCartIntoUser(guestKey: string, userId: string) {
  const db = await getSalesDb()
  const guest = await db.collection<CartDoc>('carts').findOne({ userId: guestKey })
  if (!guest?.items?.length) return

  for (const item of guest.items) {
    await addCartItem(userId, item)
  }

  await db.collection('carts').updateOne(
    { userId: guestKey },
    { $set: { items: [], updatedAt: new Date() } }
  )
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
