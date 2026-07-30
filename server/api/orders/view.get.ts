import { isSalesDbConfigured } from '../../database/sales'
import { getOrderByNumber, toPublicOrder } from '../../core/sales/order.repository'
import { releaseExpiredOrderStockIfNeeded } from '../../core/sales/order-stock-lifecycle'
import { decodeOrderAccessToken } from '../../utils/order-access-token'

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Pedidos no disponibles' })
  }

  const query = getQuery(event)
  const token = typeof query.token === 'string' ? query.token.trim() : ''
  if (!token) {
    throw createError({ statusCode: 400, message: 'Enlace de pedido inválido o incompleto.' })
  }

  const config = useRuntimeConfig()
  const secret = config.jwtSecret?.trim()
  if (!secret) {
    throw createError({ statusCode: 503, message: 'Configuración de seguridad incompleta' })
  }

  const decoded = await decodeOrderAccessToken(token, secret)
  if (!decoded) {
    throw createError({
      statusCode: 403,
      message: 'Este enlace expiró o no es válido. Revisa tu correo de confirmación.',
    })
  }

  const order = await getOrderByNumber(decoded.orderNumber)
  if (!order) {
    throw createError({ statusCode: 404, message: 'Orden no encontrada' })
  }

  await releaseExpiredOrderStockIfNeeded(order, event)

  return toPublicOrder(order)
})
