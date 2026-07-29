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

  const [catalog, auth, sales] = await Promise.all([
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
  ])

  return {
    status: 'ok',
    service: 'lumia2',
    siteUrl: config.siteUrl || null,
    mongo: { catalog, auth, sales },
    timestamp: new Date().toISOString(),
  }
})
