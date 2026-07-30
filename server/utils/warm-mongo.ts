import { getCatalogDb, isCatalogDbConfigured } from '../database/catalog'
import { getSalesDb, isSalesDbConfigured } from '../database/sales'
import { isD1StockAvailable } from '../core/sales/d1-stock-reservation'

export interface WarmCheckoutOptions {
  /** Si false, solo precalienta sales_db (checkout sin reserva de stock). */
  reserveStock?: boolean
  event?: import('h3').H3Event
}

/**
 * Precalienta conexiones Mongo en paralelo.
 * sales_db y catalog_db se conectan a la vez (no en serie) cuando hace falta.
 * Con D1 bound, las reservas van a edge — no hace falta calentar catalog_db.
 */
export async function warmCheckoutMongo(options: WarmCheckoutOptions = {}): Promise<void> {
  const reserveStock = options.reserveStock !== false
  const tasks: Promise<unknown>[] = []

  if (isSalesDbConfigured()) tasks.push(getSalesDb())

  const useD1Stock = reserveStock && options.event && (await isD1StockAvailable(options.event))

  if (reserveStock && isCatalogDbConfigured() && !useD1Stock) {
    tasks.push(getCatalogDb())
  }

  if (!tasks.length) return
  await Promise.all(tasks)
}
