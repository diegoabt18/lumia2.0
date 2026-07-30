import { proxyToLumiaApi } from '../utils/lumia-api-client'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const data = await proxyToLumiaApi(event, '/health')
  return {
    status: 'ok',
    service: 'lumia2',
    siteUrl: config.siteUrl || null,
    api: data,
    timestamp: new Date().toISOString(),
  }
})
