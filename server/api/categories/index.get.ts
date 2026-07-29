import { listCategories, countProductsByCategorySlug } from '../../core/catalog/infrastructure/category.repository'

export default defineEventHandler(async () => {
  try {
    const [categories, counts] = await Promise.all([listCategories(), countProductsByCategorySlug()])
    const mapped = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: counts.get(c.slug) ?? 0,
    }))
    return { categories: mapped, items: mapped }
  } catch (e) {
    console.error('[api/categories]', e)
    throw createError({ statusCode: 503, message: 'Categorías no disponibles' })
  }
})
