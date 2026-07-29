import type { StockReservationLine } from './stock-reservation'
import { releaseCartStockReservations } from './stock-reservation'
import { getSalesDb } from '../../database/sales'
import type { OrderDoc } from './order.repository'
import type { OrderStockReservationStatus } from './order.repository'

/** Libera reservas de inventario asociadas a un pedido (cancelación / expiración). */
export async function releaseOrderStockReservations(order: OrderDoc): Promise<boolean> {
  const lines = order.stockReservations ?? []
  if (!lines.length || order.stockReservationStatus === 'released') return false

  await releaseCartStockReservations(lines as StockReservationLine[])

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
export async function commitOrderStockReservations(order: OrderDoc): Promise<boolean> {
  const lines = order.stockReservations ?? []
  if (!lines.length || order.stockReservationStatus === 'committed') return false
  if (order.stockReservationStatus === 'released') return false

  const { isCatalogDbConfigured, getCatalogDb } = await import('../../database/catalog')
  if (!isCatalogDbConfigured()) return false

  const db = await getCatalogDb()

  for (const line of lines as StockReservationLine[]) {
    if (line.source === 'inventory' && line.inventoryId) {
      await db.collection('inventory_items').updateOne(
        { _id: line.inventoryId },
        { $inc: { quantity: -line.quantity, reserved: -line.quantity } }
      )
      continue
    }
    if (line.source === 'variant') {
      await db.collection('variants').updateOne(
        { sku: line.sku },
        {
          $inc: {
            reserved: -line.quantity,
            stock: -line.quantity,
            available: -line.quantity,
          },
        }
      )
    }
  }

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
export async function releaseExpiredOrderStockIfNeeded(order: OrderDoc): Promise<boolean> {
  if (order.paymentStatus !== 'pending_manual') return false
  if (order.stockReservationStatus === 'released' || order.stockReservationStatus === 'committed') {
    return false
  }
  const expiresAt = order.expiresAt instanceof Date ? order.expiresAt : order.expiresAt ? new Date(order.expiresAt) : null
  if (!expiresAt || expiresAt.getTime() > Date.now()) return false
  return releaseOrderStockReservations(order)
}

export async function expireStalePendingOrders(limit = 50): Promise<number> {
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
    const ok = await releaseOrderStockReservations({
      ...order,
      stockReservationStatus: order.stockReservationStatus ?? 'held',
    })
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
  return released
}
