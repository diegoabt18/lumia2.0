import { LEGAL_SLUGS } from '#shared/legal/content'
import { listProducts } from '../core/catalog/infrastructure/product.repository'
import { isCatalogDbConfigured } from '../database/catalog'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = (config.siteUrl || getRequestURL(event).origin).replace(/\/$/, '')

  const staticPaths = ['/', '/products', '/cart', '/checkout', '/auth/login', '/design-system']
  const legalPaths = LEGAL_SLUGS.map((s) => `/legal/${s}`)

  let productPaths: string[] = []
  if (isCatalogDbConfigured()) {
    try {
      const products = await listProducts({ limit: 200 })
      productPaths = products.map((p) => `/products/${encodeURIComponent(p.slug)}`)
    } catch {
      /* catálogo offline → sitemap estático */
    }
  }

  const urls = [...staticPaths, ...legalPaths, ...productPaths]
  const today = new Date().toISOString().slice(0, 10)

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${today}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return body
})
