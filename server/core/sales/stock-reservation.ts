import type { ObjectId } from 'mongodb'
import type { CartItem } from '#shared/types/product'
import type { VariantDoc } from '../catalog/infrastructure/product.repository'

export interface StockReservationLine {
  sku: string
  quantity: number
  source: 'inventory' | 'variant'
  inventoryId?: ObjectId
}

interface StockMeta {
  sku: string
  isMadeToOrder: boolean
  hasInventoryRow: boolean
}

async function loadStockMeta(skus: string[]): Promise<Map<string, StockMeta>> {
  const { isCatalogDbConfigured, getCatalogDb } = await import('../../database/catalog')
  if (!isCatalogDbConfigured() || !skus.length) return new Map()

  const db = await getCatalogDb()
  const rows = await db
    .collection<VariantDoc>('variants')
    .aggregate<StockMeta>([
      { $match: { sku: { $in: skus } } },
      {
        $lookup: {
          from: 'inventory_items',
          localField: 'sku',
          foreignField: 'sku',
          as: 'inv',
        },
      },
      {
        $project: {
          sku: 1,
          isMadeToOrder: {
            $cond: [
              { $eq: [{ $ifNull: ['$is_per_order', false] }, true] },
              true,
              { $eq: [{ $ifNull: [{ $arrayElemAt: ['$inv.is_per_order', 0] }, false] }, true] },
            ],
          },
          hasInventoryRow: { $gt: [{ $size: '$inv' }, 0] },
        },
      },
    ])
    .toArray()

  return new Map(rows.map((r) => [r.sku, r]))
}

async function reserveInventorySku(
  db: Awaited<ReturnType<typeof import('../../database/catalog').getCatalogDb>>,
  sku: string,
  quantity: number
): Promise<StockReservationLine[] | null> {
  const reservations: StockReservationLine[] = []
  let remaining = quantity

  const docs = await db
    .collection('inventory_items')
    .find({ sku })
    .sort({ _id: 1 })
    .project({ quantity: 1, reserved: 1 })
    .toArray()

  for (const doc of docs) {
    if (remaining <= 0) break

    const available = Math.max(0, Number(doc.quantity ?? 0) - Number(doc.reserved ?? 0))
    if (available <= 0) continue

    const take = Math.min(remaining, available)
    const updated = await db.collection('inventory_items').updateOne(
      {
        _id: doc._id,
        $expr: {
          $gte: [
            {
              $subtract: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$reserved', 0] }],
            },
            take,
          ],
        },
      },
      { $inc: { reserved: take } }
    )

    if (updated.modifiedCount === 0) continue

    reservations.push({
      sku,
      quantity: take,
      source: 'inventory',
      inventoryId: doc._id as ObjectId,
    })
    remaining -= take
  }

  if (remaining > 0) {
    if (reservations.length) await releaseCartStockReservations(reservations)
    return null
  }

  return reservations
}

async function reserveVariantSku(
  db: Awaited<ReturnType<typeof import('../../database/catalog').getCatalogDb>>,
  sku: string,
  quantity: number
): Promise<StockReservationLine | null> {
  const updated = await db.collection('variants').updateOne(
    {
      sku,
      $expr: {
        $gte: [
          {
            $subtract: [
              { $ifNull: ['$available', { $ifNull: ['$stock', 0] }] },
              { $ifNull: ['$reserved', 0] },
            ],
          },
          quantity,
        ],
      },
    },
    { $inc: { reserved: quantity } }
  )

  if (updated.modifiedCount === 0) return null
  return { sku, quantity, source: 'variant' }
}

/** Reserva stock de forma atómica antes de crear el pedido. */
export async function reserveCartStock(items: CartItem[]): Promise<StockReservationLine[]> {
  const { isCatalogDbConfigured, getCatalogDb } = await import('../../database/catalog')
  if (!isCatalogDbConfigured() || !items.length) return []

  const skus = [...new Set(items.map((i) => i.sku))]
  const meta = await loadStockMeta(skus)
  const db = await getCatalogDb()
  const reservations: StockReservationLine[] = []

  try {
    for (const item of items) {
      const row = meta.get(item.sku)
      if (!row || row.isMadeToOrder) continue

      let lines: StockReservationLine[] | StockReservationLine | null = null
      if (row.hasInventoryRow) {
        lines = await reserveInventorySku(db, item.sku, item.quantity)
      } else {
        lines = await reserveVariantSku(db, item.sku, item.quantity)
      }

      if (!lines || (Array.isArray(lines) && !lines.length)) {
        throw createError({
          statusCode: 409,
          message: `${item.productName}: el stock cambió mientras confirmabas. Revisa tu carrito.`,
        })
      }

      if (Array.isArray(lines)) reservations.push(...lines)
      else reservations.push(lines)
    }

    return reservations
  } catch (e) {
    await releaseCartStockReservations(reservations)
    throw e
  }
}

/** Libera reservas si falla la creación del pedido. */
export async function releaseCartStockReservations(lines: StockReservationLine[]): Promise<void> {
  if (!lines.length) return

  const { isCatalogDbConfigured, getCatalogDb } = await import('../../database/catalog')
  if (!isCatalogDbConfigured()) return

  const db = await getCatalogDb()
  await Promise.all(
    lines.map(async (line) => {
      if (line.source === 'inventory' && line.inventoryId) {
        await db
          .collection('inventory_items')
          .updateOne({ _id: line.inventoryId }, { $inc: { reserved: -line.quantity } })
        return
      }
      if (line.source === 'variant') {
        await db.collection('variants').updateOne({ sku: line.sku }, { $inc: { reserved: -line.quantity } })
      }
    })
  )
}
