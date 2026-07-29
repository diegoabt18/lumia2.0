/** Textos de envío compartidos entre mini checkout y página de carrito. */
export const CART_SHIPPING_WARNING_TITLE = 'Envío no incluido'

export const CART_SHIPPING_WARNING_MESSAGE =
  'El costo de envío no está incluido en el subtotal. Acordaremos contigo el método y la transportadora según tu ciudad antes o después de confirmar el pago.'

export const CART_SHIPPING_ROW_LABEL = 'A confirmar'

export const CART_SHIPPING_ROW_HINT = 'Se define al coordinar el pedido con el vendedor.'

export function buildFreeShippingRemainingLabel(
  remaining: number,
  formatPrice: (amount: number, currency?: string) => string,
  currency = 'COP'
) {
  if (remaining <= 0) return '¡Envío gratis desbloqueado!'
  return `Te faltan ${formatPrice(remaining, currency)} para envío gratis`
}
