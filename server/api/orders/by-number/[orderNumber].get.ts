import { isSalesDbConfigured } from '../../../database/sales'
import { getOrderByNumber, toPublicOrder } from '../../../core/sales/order.repository'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Pedidos no disponibles' })
  }

  const orderNumber = getRouterParam(event, 'orderNumber')
  if (!orderNumber?.trim()) {
    throw createError({ statusCode: 400, message: 'orderNumber es requerido' })
  }

  const order = await getOrderByNumber(decodeURIComponent(orderNumber))
  if (!order) {
    throw createError({ statusCode: 404, message: 'Orden no encontrada' })
  }

  return toPublicOrder(order)
})
