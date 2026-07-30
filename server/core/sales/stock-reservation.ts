import type { Db, ObjectId } from 'mongodb'
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

type InventoryRow = {
  _id: ObjectId
  sku: string
  quantity?: number
  reserved?: number
  is_per_order?: boolean
}

/** Fase 1 — 2 lecturas en paralelo (variants + inventory). */
async function preloadStockContext(db: Db, skus: string[]) {
  const [variants, inventoryRows] = await Promise.all([
    db
      .collection<VariantDoc>('variants')
      .find({ sku: { $in: skus } })
      .project({ sku: 1, is_per_order: 1, stock: 1, available: 1, reserved: 1 })
      .toArray(),
    db
      .collection<InventoryRow>('inventory_items')
      .find({ sku: { $in: skus } })
      .sort({ _id: 1 })
      .project({ sku: 1, quantity: 1, reserved: 1, is_per_order: 1 })
      .toArray(),
  ])

  const invBySku = new Map<string, InventoryRow[]>()
  for (const row of inventoryRows) {
    const list = invBySku.get(row.sku) ?? []
    list.push(row)
    invBySku.set(row.sku, list)
  }

  const meta = new Map<string, StockMeta>()
  for (const sku of skus) {
    const variant = variants.find((v) => v.sku === sku)
    const invList = invBySku.get(sku) ?? []
    meta.set(sku, {
      sku,
      isMadeToOrder: Boolean(variant?.is_per_order || invList.some((i) => i.is_per_order)),
      hasInventoryRow: invList.length > 0,
    })
  }

  return { meta, invBySku }
}

async function reserveVariantSku(db: Db, sku: string, quantity: number): Promise<StockReservationLine | null> {
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

/** Fase 2a — Reservas de variantes en paralelo (SKUs distintos). */
async function parallelReserveVariants(
  db: Db,
  lines: Array<{ sku: string; quantity: number; productName: string }>
): Promise<StockReservationLine[]> {
  if (!lines.length) return []

  const settled = await Promise.all(
    lines.map(async (line) => {
      const row = await reserveVariantSku(db, line.sku, line.quantity)
      return { line, row }
    })
  )

  const reservations: StockReservationLine[] = []
  for (const { line, row } of settled) {
    if (!row) {
      await releaseCartStockReservations(reservations)
      throw createError({
        statusCode: 409,
        message: `${line.productName}: el stock cambió mientras confirmabas. Revisa tu carrito.`,
      })
    }
    reservations.push(row)
  }

  return reservations
}

async function reserveInventorySku(
  db: Db,
  sku: string,
  quantity: number,
  productName: string,
  preloaded: InventoryRow[]
): Promise<StockReservationLine[]> {
  const reservations: StockReservationLine[] = []
  let remaining = quantity

  for (const doc of preloaded) {
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
      inventoryId: doc._id,
    })
    remaining -= take
  }

  if (remaining > 0) {
    throw createError({
      statusCode: 409,
      message: `${productName}: el stock cambió mientras confirmabas. Revisa tu carrito.`,
    })
  }

  return reservations
}

/**
 * Reserva stock:
 * 1. Lecturas paralelas (variants + inventory)
 * 2. Escrituras variantes en paralelo; inventario en serie por SKU
 */
export async function reserveCartStock(items: CartItem[]): Promise<StockReservationLine[]> {
  const { isCatalogDbConfigured, getCatalogDb } = await import('../../database/catalog')
  if (!isCatalogDbConfigured() || !items.length) return []

  const skus = [...new Set(items.map((i) => i.sku))]
  const db = await getCatalogDb()
  const { meta, invBySku } = await preloadStockContext(db, skus)

  const variantLines: Array<{ sku: string; quantity: number; productName: string }> = []
  const inventoryLines: CartItem[] = []

  for (const item of items) {
    const row = meta.get(item.sku)
    if (!row || row.isMadeToOrder) continue
    if (row.hasInventoryRow) inventoryLines.push(item)
    else variantLines.push({ sku: item.sku, quantity: item.quantity, productName: item.productName })
  }

  const reservations: StockReservationLine[] = []

  try {
    if (variantLines.length) {
      reservations.push(...(await parallelReserveVariants(db, variantLines)))
    }

    for (const item of inventoryLines) {
      const lines = await reserveInventorySku(
        db,
        item.sku,
        item.quantity,
        item.productName,
        invBySku.get(item.sku) ?? []
      )
      reservations.push(...lines)
    }

    return reservations
  } catch (e) {
    await releaseCartStockReservations(reservations)
    throw e
  }
}

/** Libera reservas en paralelo si falla la creación del pedido. */
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
