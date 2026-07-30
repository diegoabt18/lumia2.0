import type { Db } from 'mongodb'
import type { InventorySummary } from '../application/resolve-variant-stock'

/** Agrega stock por SKU desde `inventory_items` (fuente operativa en lumia). */
export async function loadInventoryBySku(db: Db): Promise<Map<string, InventorySummary>> {
  const rows = await db
    .collection('inventory_items')
    .aggregate<{ _id: string; quantity: number; reserved: number; isPerOrder: number }>([
      {
        $group: {
          _id: '$sku',
          quantity: { $sum: { $ifNull: ['$quantity', 0] } },
          reserved: { $sum: { $ifNull: ['$reserved', 0] } },
          isPerOrder: {
            $max: {
              $cond: [{ $eq: [{ $ifNull: ['$is_per_order', false] }, true] }, 1, 0],
            },
          },
        },
      },
    ])
    .toArray()

  const map = new Map<string, InventorySummary>()
  for (const row of rows) {
    const sku = row._id?.trim()
    if (!sku) continue
    map.set(sku, {
      quantity: Number(row.quantity ?? 0),
      reserved: Number(row.reserved ?? 0),
      isPerOrder: row.isPerOrder === 1,
    })
  }
  return map
}
