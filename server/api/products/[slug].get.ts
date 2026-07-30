import { getProductBySlug, getResolvedCatalogSource } from '../../core/catalog/application/catalog-reader'
import { withServerTimeout } from '../../utils/server-timeout'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug requerido' })
  }

  try {
    const product = await withServerTimeout(getProductBySlug(slug, event), 8_000, 'product detail')
    if (!product) {
      throw createError({ statusCode: 404, message: 'Producto no encontrado' })
    }
    return { product, source: await getResolvedCatalogSource(event) }
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    if (err.statusCode === 404 || err.statusCode === 503) throw e
    console.error('[api/products/slug]', e)
    throw createError({ statusCode: 500, message: 'Error al cargar producto' })
  }
})
