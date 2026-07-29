import { isSalesDbConfigured } from '../../database/sales'
import { listOrdersByUserId, toPublicOrder } from '../../core/sales/order.repository'
import { getSessionFromEvent } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSessionFromEvent(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Inicia sesión para ver tus pedidos' })
  }
  if (!isSalesDbConfigured()) {
    return { orders: [] }
  }

  const orders = await listOrdersByUserId(session.userId)
  return { orders: orders.map(toPublicOrder) }
})
