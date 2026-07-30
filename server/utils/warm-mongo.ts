import { getCatalogDb, isCatalogDbConfigured } from '../database/catalog'
import { getSalesDb, isSalesDbConfigured } from '../database/sales'

export interface WarmCheckoutOptions {
  /** Si false, solo precalienta sales_db (checkout sin reserva de stock). */
  reserveStock?: boolean
}

/**
 * Precalienta conexiones Mongo en paralelo.
 * sales_db y catalog_db se conectan a la vez (no en serie) cuando hace falta.
 */
export async function warmCheckoutMongo(options: WarmCheckoutOptions = {}): Promise<void> {
  const reserveStock = options.reserveStock !== false
  const tasks: Promise<unknown>[] = []

  if (isSalesDbConfigured()) tasks.push(getSalesDb())
  if (reserveStock && isCatalogDbConfigured()) tasks.push(getCatalogDb())

  if (!tasks.length) return
  await Promise.all(tasks)
}
