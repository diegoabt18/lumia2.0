import type { H3Event } from 'h3'
import { LEGAL_SLUGS } from '#shared/legal/content'
import { lumiaApiFetch } from '../utils/lumia-api-client'

async function loadAllProductPaths(event: H3Event): Promise<string[]> {
  const paths: string[] = []
  const pageSize = 100
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const data = await lumiaApiFetch<{
      products?: Array<{ slug: string }>
      items?: Array<{ slug: string }>
      pagination?: { totalPages: number }
    }>(event, '/api/products', { query: { page, limit: pageSize } })

    const products = data.products?.length ? data.products : data.items ?? []
    if (!products.length) break

    paths.push(...products.map((p) => `/products/${encodeURIComponent(p.slug)}`))
    totalPages = data.pagination?.totalPages ?? page
    page++
  }

  return paths
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = (config.siteUrl || getRequestURL(event).origin).replace(/\/$/, '')

  const staticPaths = ['/', '/products', '/auth/login']
  const legalPaths = LEGAL_SLUGS.map((s) => `/legal/${s}`)

  let productPaths: string[] = []
  try {
    productPaths = await loadAllProductPaths(event)
  } catch {
    /* API offline → sitemap estático */
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
  </url>`,
  )
  .join('\n')}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return body
})
