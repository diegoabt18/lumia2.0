export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const siteUrl = (config.siteUrl || getRequestURL(event).origin).replace(/\/$/, '')
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /account/',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ]
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return lines.join('\n')
})
