import { LEGAL_SLUGS } from '#shared/legal/content'
import { listProductsPage } from '../core/catalog/infrastructure/product.repository'
import { isCatalogDbConfigured } from '../database/catalog'

async function loadAllProductPaths(): Promise<string[]> {
  const paths: string[] = []
  const pageSize = 100
  let skip = 0
  let total = Number.POSITIVE_INFINITY

  while (skip < total) {
    const { products, total: count } = await listProductsPage({ limit: pageSize, skip })
    total = count
    if (!products.length) break
    paths.push(...products.map((p) => `/products/${encodeURIComponent(p.slug)}`))
    skip += products.length
    if (products.length < pageSize) break
  }

  return paths
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = (config.siteUrl || getRequestURL(event).origin).replace(/\/$/, '')

  const staticPaths = ['/', '/products', '/auth/login']
  const legalPaths = LEGAL_SLUGS.map((s) => `/legal/${s}`)

  let productPaths: string[] = []
  if (isCatalogDbConfigured()) {
    try {
      productPaths = await loadAllProductPaths()
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
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return body
})
