import { getCatalogDb, isCatalogDbConfigured } from '../database/catalog'
import { getSalesDb, isSalesDbConfigured } from '../database/sales'

/** Precalienta conexiones Mongo en paralelo antes del pipeline de checkout. */
export async function warmCheckoutMongo(): Promise<void> {
  const tasks: Promise<unknown>[] = []
  if (isSalesDbConfigured()) tasks.push(getSalesDb())
  if (isCatalogDbConfigured()) tasks.push(getCatalogDb())
  if (!tasks.length) return
  await Promise.all(tasks)
}
