interface OrderEmailPayload {
  orderNumber: string
  customerName: string
  total: number
  currency: string
  phone: string
  items: Array<{ name: string; quantity: number; subtotal: number }>
  viewOrderUrl?: string | null
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

async function sendResendEmail(input: {
  to: string | string[]
  subject: string
  html: string
}) {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey?.trim()
  const from = config.resendFrom?.trim() || 'LUMIA <onboarding@resend.dev>'
  if (!apiKey) return false

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
    }),
  })

  if (!res.ok) {
    console.warn('[email] Resend error', res.status, await res.text().catch(() => ''))
    return false
  }
  return true
}

function buildOrderHtml(order: OrderEmailPayload, intro: string) {
  const lines = order.items
    .map((i) => `<li>${i.name} × ${i.quantity} — ${formatMoney(i.subtotal, order.currency)}</li>`)
    .join('')
  const viewLink = order.viewOrderUrl
    ? `<p style="margin-top:20px"><a href="${order.viewOrderUrl}" style="display:inline-block;padding:12px 20px;background:#2B2B2B;color:#fff;text-decoration:none;border-radius:999px;font-size:14px">Ver mi pedido</a></p>
       <p style="font-size:11px;color:#888;margin-top:8px">Guarda este enlace para consultar el estado de tu pedido.</p>`
    : ''
  return `
    <div style="font-family:sans-serif;color:#2B2B2B;max-width:560px">
      <p style="font-size:18px;font-weight:600">LUMIA</p>
      <p>${intro}</p>
      <p><strong>Pedido:</strong> ${order.orderNumber}<br/>
      <strong>Cliente:</strong> ${order.customerName}<br/>
      <strong>Teléfono:</strong> ${order.phone}<br/>
      <strong>Total:</strong> ${formatMoney(order.total, order.currency)}</p>
      <ul>${lines}</ul>
      ${viewLink}
      <p style="font-size:12px;color:#666;margin-top:16px">Pago acordado con el vendedor — pendiente de confirmación.</p>
    </div>
  `
}

export async function sendOrderConfirmationEmails(order: OrderEmailPayload, customerEmail?: string | null) {
  const config = useRuntimeConfig()
  const notify = config.orderNotifyEmail?.trim()

  const tasks: Promise<boolean>[] = []

  if (customerEmail?.trim()) {
    tasks.push(
      sendResendEmail({
        to: customerEmail.trim(),
        subject: `Pedido ${order.orderNumber} recibido — LUMIA`,
        html: buildOrderHtml(
          order,
          'Gracias por tu pedido. Te contactaremos pronto para coordinar el pago y la entrega.'
        ),
      })
    )
  }

  if (notify) {
    tasks.push(
      sendResendEmail({
        to: notify,
        subject: `[Nuevo pedido] ${order.orderNumber}`,
        html: buildOrderHtml(order, 'Nuevo pedido registrado en la tienda.'),
      })
    )
  }

  if (!tasks.length) return
  await Promise.allSettled(tasks)
}

export async function sendNewsletterWelcomeEmail(email: string) {
  const html = `
    <div style="font-family:sans-serif;color:#2B2B2B;max-width:560px">
      <p style="font-size:18px;font-weight:600">LUMIA</p>
      <p>Gracias por suscribirte. Te avisaremos de lanzamientos y ediciones limitadas.</p>
    </div>
  `
  return sendResendEmail({
    to: email,
    subject: 'Suscripción confirmada — LUMIA',
    html,
  })
}
