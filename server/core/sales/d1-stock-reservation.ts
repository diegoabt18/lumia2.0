import type { H3Event } from 'h3'
import type { CartItem } from '#shared/types/product'
import {
  createCatalogWriteSession,
  getCatalogD1,
  type CatalogD1DatabaseSession,
} from '../../database/catalog-d1'
import { getD1SchemaInfo, variantSelectSql } from '../../utils/d1-schema'
import type { StockReservationLine } from './stock-reservation'

export interface D1VariantStockRow {
  sku: string
  product_slug: string
  price: number
  currency: string
  options_json: string | null
  image_path: string | null
  stock: number | null
  available: number | null
  reserved: number | null
  is_per_order: number
}

const VARIANT_STOCK_SELECT_LEGACY = `sku, product_slug, price, currency, options_json, image_path,
  stock, available, 0 AS reserved, is_per_order`

export function getD1WriteSession(event?: H3Event): CatalogD1DatabaseSession | null {
  const db = getCatalogD1(event)
  if (!db) return null
  return createCatalogWriteSession(db)
}

export function computeSellableUnits(row: {
  stock: number | null
  available: number | null
  reserved?: number | null
  is_per_order?: number
}): number | null {
  if (row.is_per_order === 1) return null
  const hasBase = typeof row.available === 'number' || typeof row.stock === 'number'
  if (!hasBase) return null
  const base = row.available ?? row.stock ?? 0
  const reserved = row.reserved ?? 0
  return Math.max(0, base - reserved)
}

export async function getVariantStockRowD1(
  event: H3Event,
  sku: string
): Promise<D1VariantStockRow | null> {
  const db = getCatalogD1(event)
  if (!db) return null
  const { hasReserved } = await getD1SchemaInfo(event)
  const cols = hasReserved ? variantSelectSql(true) : VARIANT_STOCK_SELECT_LEGACY
  const session = db.withSession('first-unconstrained') as CatalogD1DatabaseSession
  return session.prepare(`SELECT ${cols} FROM variants WHERE sku = ? LIMIT 1`).bind(sku).first<D1VariantStockRow>()
}

function rowsChanged(result: { meta?: { changes?: number } }): boolean {
  return (result.meta?.changes ?? 0) > 0
}

async function reserveSkuD1(
  session: CatalogD1DatabaseSession,
  sku: string,
  quantity: number
): Promise<boolean> {
  const result = await session
    .prepare(
      `UPDATE variants
       SET reserved = COALESCE(reserved, 0) + ?
       WHERE sku = ?
         AND is_per_order = 0
         AND (COALESCE(available, stock, 0) - COALESCE(reserved, 0)) >= ?`
    )
    .bind(quantity, sku, quantity)
    .run()
  return rowsChanged(result)
}

async function releaseSkuD1(
  session: CatalogD1DatabaseSession,
  sku: string,
  quantity: number
): Promise<void> {
  await session
    .prepare(
      `UPDATE variants
       SET reserved = MAX(0, COALESCE(reserved, 0) - ?)
       WHERE sku = ?
         AND COALESCE(reserved, 0) > 0`
    )
    .bind(quantity, sku)
    .run()
}

async function commitSkuD1(
  session: CatalogD1DatabaseSession,
  sku: string,
  quantity: number
): Promise<boolean> {
  const result = await session
    .prepare(
      `UPDATE variants
       SET reserved = COALESCE(reserved, 0) - ?,
           stock = CASE WHEN stock IS NOT NULL THEN MAX(0, stock - ?) ELSE stock END,
           available = CASE WHEN available IS NOT NULL THEN MAX(0, available - ?) ELSE available END
       WHERE sku = ?
         AND COALESCE(reserved, 0) >= ?`
    )
    .bind(quantity, quantity, quantity, sku, quantity)
    .run()
  return rowsChanged(result)
}

/** Reserva stock en D1 (edge). Requiere binding CATALOG_DB. */
export async function reserveCartStockD1(
  items: CartItem[],
  event?: H3Event
): Promise<StockReservationLine[]> {
  const session = getD1WriteSession(event)
  if (!session || !items.length) return []

  const skus = [...new Set(items.map((i) => i.sku))]
  const placeholders = skus.map(() => '?').join(', ')
  const { results } = await session
    .prepare(`SELECT sku, is_per_order FROM variants WHERE sku IN (${placeholders})`)
    .bind(...skus)
    .all<{ sku: string; is_per_order: number }>()

  const madeToOrder = new Set(
    (results ?? []).filter((row) => row.is_per_order === 1).map((row) => row.sku)
  )

  const reservations: StockReservationLine[] = []

  try {
    for (const item of items) {
      if (madeToOrder.has(item.sku)) continue

      const ok = await reserveSkuD1(session, item.sku, item.quantity)
      if (!ok) {
        await releaseD1StockReservations(reservations, event)
        throw createError({
          statusCode: 409,
          message: `${item.productName}: el stock cambió mientras confirmabas. Revisa tu carrito.`,
        })
      }
      reservations.push({ sku: item.sku, quantity: item.quantity, source: 'd1' })
    }
    return reservations
  } catch (e) {
    await releaseD1StockReservations(reservations, event)
    throw e
  }
}

export async function releaseD1StockReservations(
  lines: StockReservationLine[],
  event?: H3Event
): Promise<void> {
  const d1Lines = lines.filter((line) => line.source === 'd1')
  if (!d1Lines.length) return

  const session = getD1WriteSession(event)
  if (!session) return

  await Promise.all(d1Lines.map((line) => releaseSkuD1(session, line.sku, line.quantity)))
}

export async function commitD1StockReservations(
  lines: StockReservationLine[],
  event?: H3Event
): Promise<void> {
  const d1Lines = lines.filter((line) => line.source === 'd1')
  if (!d1Lines.length) return

  const session = getD1WriteSession(event)
  if (!session) return

  for (const line of d1Lines) {
    const ok = await commitSkuD1(session, line.sku, line.quantity)
    if (!ok) {
      console.warn(`[d1-stock] commit failed for sku=${line.sku} qty=${line.quantity}`)
    }
  }
}

export async function isD1StockAvailable(event?: H3Event): Promise<boolean> {
  if (!getCatalogD1(event)) return false
  const { hasReserved } = await getD1SchemaInfo(event)
  return hasReserved
}
