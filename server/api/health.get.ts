export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  async function pingMongo(configured: boolean, getDb: () => Promise<{ command: (cmd: object) => Promise<unknown> }>) {
    if (!configured) return { configured: false, connected: false }
    try {
      const db = await getDb()
      await db.command({ ping: 1 })
      return { configured: true, connected: true }
    } catch {
      return { configured: true, connected: false }
    }
  }

  const [catalog, auth, sales, catalogD1] = await Promise.all([
    pingMongo(Boolean(config.mongoCatalogUri?.trim()), async () => {
      const { getCatalogDb } = await import('../database/catalog')
      return getCatalogDb()
    }),
    pingMongo(Boolean(config.mongoAuthUri?.trim()), async () => {
      const { getAuthDb } = await import('../database/auth')
      return getAuthDb()
    }),
    pingMongo(Boolean(config.mongoSalesUri?.trim()), async () => {
      const { getSalesDb } = await import('../database/sales')
      return getSalesDb()
    }),
    (async () => {
      const { pingCatalogD1 } = await import('../database/catalog-d1')
      const { getConfiguredCatalogSourceMode, resolveCatalogSourceForEventAsync } = await import(
        '../utils/catalog-source'
      )
      const d1 = await pingCatalogD1(event)
      const mode = getConfiguredCatalogSourceMode()
      const active = await resolveCatalogSourceForEventAsync(event)
      let d1ProductCount: number | null = null
      if (d1.connected) {
        try {
          const { getCatalogD1 } = await import('../database/catalog-d1')
          const db = getCatalogD1(event)
          if (db) {
            const row = await db.prepare(`SELECT COUNT(*) AS n FROM products`).first<{ n: number }>()
            d1ProductCount = row?.n ?? 0
          }
        } catch {
          d1ProductCount = null
        }
      }
      return { ...d1, mode, active, d1ProductCount }
    })(),
  ])

  return {
    status: 'ok',
    service: 'lumia2',
    siteUrl: config.siteUrl || null,
    mongo: { catalog, auth, sales },
    catalogD1,
    timestamp: new Date().toISOString(),
  }
})
