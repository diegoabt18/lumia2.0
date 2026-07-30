import type { H3Event } from 'h3'
import type { StockReservationLine } from './stock-reservation'
import { commitCartStockReservations, releaseCartStockReservations } from './stock-reservation'
import { getSalesDb } from '../../database/sales'
import type { OrderDoc } from './order.repository'
import type { OrderStockReservationStatus } from './order.repository'
import { invalidateCatalogCaches } from '../../utils/catalog-cache'

/** Libera reservas de inventario asociadas a un pedido (cancelación / expiración). */
export async function releaseOrderStockReservations(
  order: OrderDoc,
  event?: H3Event
): Promise<boolean> {
  const lines = order.stockReservations ?? []
  if (!lines.length || order.stockReservationStatus === 'released') return false

  await releaseCartStockReservations(lines as StockReservationLine[], event)

  if (lines.some((line) => line.source === 'd1')) invalidateCatalogCaches()

  const db = await getSalesDb()
  await db.collection<OrderDoc>('orders').updateOne(
    { _id: order._id },
    {
      $set: {
        stockReservationStatus: 'released' as OrderStockReservationStatus,
        updatedAt: new Date(),
      },
      $push: {
        events: {
          type: 'inventory.released',
          timestamp: new Date(),
          source: 'system',
        },
      },
    }
  )
  return true
}

/** Confirma venta: baja stock real y libera el contador reservado (cuando el pedido se paga). */
export async function commitOrderStockReservations(
  order: OrderDoc,
  event?: H3Event
): Promise<boolean> {
  const lines = order.stockReservations ?? []
  if (!lines.length || order.stockReservationStatus === 'committed') return false
  if (order.stockReservationStatus === 'released') return false

  await commitCartStockReservations(lines as StockReservationLine[], event)

  const salesDb = await getSalesDb()
  await salesDb.collection<OrderDoc>('orders').updateOne(
    { _id: order._id },
    {
      $set: {
        stockReservationStatus: 'committed' as OrderStockReservationStatus,
        updatedAt: new Date(),
      },
      $push: {
        events: {
          type: 'inventory.committed',
          timestamp: new Date(),
          source: 'system',
        },
      },
    }
  )
  return true
}

/** Si el pedido expiró sin pago, libera stock una sola vez. */
export async function releaseExpiredOrderStockIfNeeded(
  order: OrderDoc,
  event?: H3Event
): Promise<boolean> {
  if (order.paymentStatus !== 'pending_manual') return false
  if (order.stockReservationStatus === 'released' || order.stockReservationStatus === 'committed') {
    return false
  }
  const expiresAt = order.expiresAt instanceof Date ? order.expiresAt : order.expiresAt ? new Date(order.expiresAt) : null
  if (!expiresAt || expiresAt.getTime() > Date.now()) return false
  return releaseOrderStockReservations(order, event)
}

export async function expireStalePendingOrders(limit = 50, event?: H3Event): Promise<number> {
  const db = await getSalesDb()
  const now = new Date()
  const orders = await db
    .collection<OrderDoc>('orders')
    .find({
      paymentStatus: 'pending_manual',
      expiresAt: { $lte: now },
      $or: [{ stockReservationStatus: 'held' }, { stockReservationStatus: { $exists: false } }],
    })
    .limit(limit)
    .toArray()

  let released = 0
  for (const order of orders) {
    const ok = await releaseOrderStockReservations(
      {
        ...order,
        stockReservationStatus: order.stockReservationStatus ?? 'held',
      },
      event
    )
    if (ok) {
      released += 1
      await db.collection<OrderDoc>('orders').updateOne(
        { _id: order._id },
        {
          $set: { status: 'pending', paymentStatus: 'pending_manual', updatedAt: new Date() },
          $push: {
            events: {
              type: 'order.expired',
              timestamp: new Date(),
              source: 'system',
            },
          },
        }
      )
    }
  }
  if (released > 0) invalidateCatalogCaches()
  return released
}
