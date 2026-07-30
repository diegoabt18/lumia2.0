import { isSalesDbConfigured } from '../../database/sales'
import { expireStalePendingOrders } from '../../core/sales/order-stock-lifecycle'
import { requireCronAuth } from '../../utils/require-cron'

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  requireCronAuth(event)

  if (!isSalesDbConfigured()) {
    return { ok: true, released: 0 }
  }

  const released = await expireStalePendingOrders(100, event)
  return { ok: true, released }
})
