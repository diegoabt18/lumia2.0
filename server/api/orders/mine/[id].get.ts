import { isSalesDbConfigured } from '../../../database/sales'
import { getOrderByIdForUser, toPublicOrder } from '../../../core/sales/order.repository'
import { releaseExpiredOrderStockIfNeeded } from '../../../core/sales/order-stock-lifecycle'
import { getSessionFromEvent } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Pedidos no disponibles' })
  }

  const session = await getSessionFromEvent(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Inicia sesión para ver este pedido.' })
  }

  const orderId = getRouterParam(event, 'id')?.trim()
  if (!orderId) {
    throw createError({ statusCode: 400, message: 'Pedido inválido' })
  }

  let order = await getOrderByIdForUser(orderId, session.userId)
  if (!order) {
    throw createError({ statusCode: 404, message: 'Orden no encontrada' })
  }

  await releaseExpiredOrderStockIfNeeded(order, event)
  order = (await getOrderByIdForUser(orderId, session.userId)) ?? order

  return toPublicOrder(order)
})
