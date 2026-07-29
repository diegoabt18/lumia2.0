export interface OrderItemForWhatsApp {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface OrderForWhatsApp {
  orderNumber: string
  createdAt: string | Date
  customerName: string
  phone: string
  email?: string | null
  address?: string
  city?: string
  reference?: string
  paymentMethod?: string
  status: string
  items: OrderItemForWhatsApp[]
  subtotal?: number
  shippingCost?: number
  total: number
  currency?: string
  notes?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  pending_manual: 'Pendiente de confirmación',
}

function formatPrice(amount: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatWhatsAppDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day} ${time}`
}

export function buildOrderSummaryMessage(order: OrderForWhatsApp): string {
  const currency = order.currency ?? 'COP'
  const lines: string[] = [
    'Hola, equipo LUMIA.',
    '',
    'Acabo de realizar un pedido y quiero compartir los detalles.',
    '',
    '──────────────────',
    '',
    `Fecha:  ${formatWhatsAppDate(order.createdAt)}`,
    `Pedido: #${order.orderNumber}`,
    '',
    `Cliente: ${order.customerName}`,
    `Teléfono: ${order.phone}`,
  ]

  if (order.email) lines.push(`Correo: ${order.email}`)

  const addr = [order.address, order.city].filter(Boolean).join(', ')
  if (addr) {
    lines.push('', `Dirección: ${addr}`)
    if (order.reference) lines.push(`   Referencia: ${order.reference}`)
  }

  lines.push('')
  if (order.paymentMethod) lines.push(`Método de pago: ${order.paymentMethod}`)
  lines.push(`Estado: ${STATUS_LABELS[order.status] ?? order.status}`)
  lines.push('', '──────────────────', '', 'Productos:', '')

  order.items.forEach((item, i) => {
    lines.push(`${i + 1}. *${item.name}*`)
    lines.push(`   - Cantidad: ${item.quantity}`)
    lines.push(`   - Valor unitario: ${formatPrice(item.unitPrice, currency)}`)
    lines.push(`   - Subtotal: ${formatPrice(item.subtotal, currency)}`)
    if (i < order.items.length - 1) lines.push('')
  })

  lines.push('──────────────────', '')
  if (order.subtotal != null) lines.push(`Subtotal: ${formatPrice(order.subtotal, currency)}`)
  if (order.shippingCost && order.shippingCost > 0) {
    lines.push(`Envío:    ${formatPrice(order.shippingCost, currency)}`)
  }
  lines.push(`TOTAL:    ${formatPrice(order.total, currency)}`)

  if (order.notes) {
    lines.push('', 'Notas:', order.notes)
  }

  lines.push('', '──────────────────', '', 'Quedo atento(a) a cualquier novedad sobre mi pedido.', '', 'Muchas gracias.')
  return lines.join('\n')
}

export function buildWhatsAppUrl(order: OrderForWhatsApp, phoneNumber: string): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(buildOrderSummaryMessage(order))}`
}
