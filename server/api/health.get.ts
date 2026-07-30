export default defineEventHandler(async () => {
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
      const { getConfiguredCatalogSourceMode, resolveCatalogSource } = await import('../utils/catalog-source')
      const d1 = await pingCatalogD1()
      const mode = getConfiguredCatalogSourceMode()
      const active = resolveCatalogSource({
        mode,
        d1Available: d1.bound && d1.connected,
        mongoAvailable: Boolean(config.mongoCatalogUri?.trim()),
      })
      return { ...d1, mode, active }
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
