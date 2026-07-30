import { createError, getHeader, type H3Event } from 'h3'

export function requireCronAuth(event: H3Event): void {
  const config = useRuntimeConfig()
  const secret = String(config.cronSecret || '').trim()
  if (!secret) {
    throw createError({ statusCode: 503, message: 'Cron no configurado (NUXT_CRON_SECRET)' })
  }

  const auth = getHeader(event, 'authorization')?.trim()
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const headerSecret = getHeader(event, 'x-cron-secret')?.trim() ?? bearer
  if (headerSecret !== secret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
}
