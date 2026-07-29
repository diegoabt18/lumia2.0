import { getCategoriesCached } from '../../utils/categories-cache'
import { setPublicCacheHeaders } from '../../utils/memory-cache'

export default defineEventHandler(async (event) => {
  try {
    const categories = await getCategoriesCached()
    setPublicCacheHeaders(event, 120)
    return { categories, items: categories }
  } catch (e) {
    console.error('[api/categories]', e)
    throw createError({ statusCode: 503, message: 'Categorías no disponibles' })
  }
})
