import type { CartItem } from '#shared/types/product'
import type { VariantDoc } from '../catalog/infrastructure/product.repository'

export interface StockIssue {
  sku: string
  productName: string
  requested: number
  available: number
}

export type StockValidationResult =
  | { ok: true }
  | { ok: false; issues: StockIssue[] }

interface StockRow {
  sku: string
  available: number
  isMadeToOrder: boolean
}

/** Valida disponibilidad antes de crear pedido (sin reservar aún). */
export async function validateCartStock(items: CartItem[]): Promise<StockValidationResult> {
  if (!items.length) return { ok: true }

  const { isCatalogDbConfigured, getCatalogDb } = await import('../../database/catalog')
  if (!isCatalogDbConfigured()) return { ok: true }

  const skus = [...new Set(items.map((i) => i.sku))]
  const db = await getCatalogDb()
  const rows = await db
    .collection<VariantDoc>('variants')
    .aggregate<StockRow>([
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
          available: {
            $let: {
              vars: {
                qty: { $sum: '$inv.quantity' },
                res: { $sum: '$inv.reserved' },
                vStock: '$stock',
                vAvail: '$available',
                vReserved: { $ifNull: ['$reserved', 0] },
              },
              in: {
                $cond: [
                  { $gt: ['$$qty', 0] },
                  { $subtract: ['$$qty', '$$res'] },
                  {
                    $subtract: [
                      { $ifNull: ['$$vAvail', { $ifNull: ['$$vStock', 0] }] },
                      '$$vReserved',
                    ],
                  },
                ],
              },
            },
          },
          isMadeToOrder: {
            $cond: [
              { $eq: [{ $ifNull: ['$is_per_order', false] }, true] },
              true,
              { $eq: [{ $ifNull: [{ $arrayElemAt: ['$inv.is_per_order', 0] }, false] }, true] },
            ],
          },
        },
      },
    ])
    .toArray()

  const bySku = new Map(rows.map((r) => [r.sku, r]))
  const issues: StockIssue[] = []

  for (const item of items) {
    const row = bySku.get(item.sku)
    if (!row) {
      issues.push({
        sku: item.sku,
        productName: item.productName,
        requested: item.quantity,
        available: 0,
      })
      continue
    }
    if (row.isMadeToOrder) continue
    const available = Math.max(0, Number(row.available ?? 0))
    if (available < item.quantity) {
      issues.push({
        sku: item.sku,
        productName: item.productName,
        requested: item.quantity,
        available,
      })
    }
  }

  return issues.length ? { ok: false, issues } : { ok: true }
}
