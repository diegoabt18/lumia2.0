import { getCategoriesCached } from '../../utils/categories-cache'
import { setCatalogSourceHeader } from '../../utils/catalog-response'
import { setPublicCacheHeaders } from '../../utils/memory-cache'

export default defineEventHandler(async (event) => {
  try {
    const categories = await getCategoriesCached(event)
    setPublicCacheHeaders(event, 120)
    const source = await setCatalogSourceHeader(event)
    return { categories, items: categories, source }
  } catch (e) {
    console.error('[api/categories]', e)
    throw createError({ statusCode: 503, message: 'Categorías no disponibles' })
  }
})
