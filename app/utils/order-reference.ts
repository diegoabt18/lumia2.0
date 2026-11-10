/**
 * Referencia que ve el cliente (ORD-XXXXXXXX). El Server la entrega ya resuelta; si falta
 * (pedidos anteriores) se usa el número del pedido, que ya es único.
 */
export function customerReferenceOf(order: { customerReference?: string | null; orderNumber?: string | null }): string {
  return order.customerReference || order.orderNumber || ''
}
