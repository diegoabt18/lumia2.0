import { isSalesDbConfigured } from '../../database/sales'
import { expireStalePendingOrders } from '../../core/sales/order-stock-lifecycle'

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  const config = useRuntimeConfig()
  const secret = String(config.cronSecret || '').trim()
  if (!secret) {
    throw createError({ statusCode: 503, message: 'Cron no configurado' })
  }

  const auth = getHeader(event, 'authorization')?.trim()
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const headerSecret = getHeader(event, 'x-cron-secret')?.trim() ?? bearer
  if (headerSecret !== secret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (!isSalesDbConfigured()) {
    return { ok: true, released: 0 }
  }

  const released = await expireStalePendingOrders(100)
  return { ok: true, released }
})
