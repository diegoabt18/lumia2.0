import type { CartItem } from '#shared/types/product'
import { isCatalogDbConfigured } from '../../database/catalog'
import { getCartItems } from './cart.repository'
import { enrichCartItems } from './enrich-cart-prices'
import { quoteStoreShipping } from '../../utils/store-shipping'

export interface CartApiPayload {
  items: CartItem[]
  subtotal: number
  total: number
  shippingCost: number
  grandTotal: number
  shippingVariable: boolean
  freeShipping: boolean
}

/** Respuesta unificada para GET/POST/PATCH carrito (enriquecida con promos y envío). */
export async function buildCartApiResponse(cartKey: string): Promise<CartApiPayload> {
  const items = await getCartItems(cartKey)
  if (!items.length) {
    return {
      items: [],
      subtotal: 0,
      total: 0,
      shippingCost: 0,
      grandTotal: 0,
      shippingVariable: quoteStoreShipping(0).variable,
      freeShipping: false,
    }
  }

  let subtotal = 0
  let enrichedItems = items

  if (isCatalogDbConfigured()) {
    try {
      const enriched = await enrichCartItems(items)
      enrichedItems = enriched.items
      subtotal = enriched.total
    } catch (e) {
      console.warn('[cart] enrich prices failed', (e as Error)?.message)
      subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    }
  } else {
    subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  }

  const shipping = quoteStoreShipping(subtotal)

  return {
    items: enrichedItems,
    subtotal,
    total: subtotal,
    shippingCost: shipping.shippingCost,
    grandTotal: shipping.grandTotal,
    shippingVariable: shipping.variable,
    freeShipping: shipping.freeShipping,
  }
}