import { getProductBySlug } from '../../core/catalog/infrastructure/product.repository'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug requerido' })
  }

  try {
    const product = await getProductBySlug(slug)
    if (!product) {
      throw createError({ statusCode: 404, message: 'Producto no encontrado' })
    }
    return { product, source: 'mongodb' as const }
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    if (err.statusCode === 404 || err.statusCode === 503) throw e
    console.error('[api/products/slug]', e)
    throw createError({ statusCode: 500, message: 'Error al cargar producto' })
  }
})
