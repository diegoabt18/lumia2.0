export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const hasCatalog = Boolean(config.mongoCatalogUri?.trim())

  let mongoOk = false
  if (hasCatalog) {
    try {
      const { getCatalogDb } = await import('../database/catalog')
      const db = await getCatalogDb()
      await db.command({ ping: 1 })
      mongoOk = true
    } catch {
      mongoOk = false
    }
  }

  return {
    status: 'ok',
    service: 'lumia2',
    mongo: {
      catalogConfigured: hasCatalog,
      catalogConnected: mongoOk,
    },
    timestamp: new Date().toISOString(),
  }
})
