import { isSalesDbConfigured } from '../../../database/sales'
import { getOrderByNumber, toPublicOrder } from '../../../core/sales/order.repository'
import { releaseExpiredOrderStockIfNeeded } from '../../../core/sales/order-stock-lifecycle'
import { getSessionFromEvent } from '../../../utils/session'
import { verifyOrderAccessToken } from '../../../utils/order-access-token'
export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Pedidos no disponibles' })
  }

  const orderNumber = getRouterParam(event, 'orderNumber')?.trim()
  if (!orderNumber) {
    throw createError({ statusCode: 400, message: 'orderNumber es requerido' })
  }

  const decoded = decodeURIComponent(orderNumber)
  let order = await getOrderByNumber(decoded)
  if (!order) {
    throw createError({ statusCode: 404, message: 'Orden no encontrada' })
  }

  await releaseExpiredOrderStockIfNeeded(order)
  order = (await getOrderByNumber(decoded)) ?? order
  const session = await getSessionFromEvent(event)
  if (session?.userId && order.userId && order.userId === session.userId) {
    return toPublicOrder(order)
  }

  const query = getQuery(event)
  const token = typeof query.token === 'string' ? query.token.trim() : ''
  const config = useRuntimeConfig()
  const secret = config.jwtSecret?.trim()
  if (token && secret && (await verifyOrderAccessToken(token, decoded, secret))) {
    return toPublicOrder(order)
  }

  throw createError({
    statusCode: 403,
    message: 'No tienes permiso para ver este pedido. Usa el enlace de confirmación o inicia sesión.',
  })
})
