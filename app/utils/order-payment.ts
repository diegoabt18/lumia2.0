/**
 * Etiquetas y reglas de presentación de pagos y saldos de pedidos (G3).
 * El estado real lo decide Server; aquí solo se traduce y se decide qué mostrar.
 */

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Sin pagos',
  pending_manual: 'Pago pendiente',
  partially_paid: 'Pago parcial',
  deposit_paid: 'Anticipo pagado',
  paid: 'Pagado',
  refunded: 'Reembolsado',
  expired: 'Vencido',
}

export function paymentStatusLabel(status: string | null | undefined): string {
  if (!status) return ''
  return PAYMENT_STATUS_LABELS[status] ?? status
}

export function fulfillmentModeLabel(mode: string | null | undefined): string {
  return mode === 'made_to_order' ? 'Por pedido' : 'Stock'
}

/** Un pedido tiene saldo abierto cuando el servidor informa un importe pendiente mayor que cero. */
export function hasOutstandingBalance(balanceDue: number | null | undefined): boolean {
  return typeof balanceDue === 'number' && balanceDue > 0
}
