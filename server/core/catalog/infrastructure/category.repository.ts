export interface CategoryDoc {
  _id?: { toString(): string }
  name: string
  slug: string
  created_at?: Date
  createdAt?: Date
}

export interface CategoryRow {
  id: string
  name: string
  slug: string
  createdAt?: Date
}

function mapCategory(doc: CategoryDoc): CategoryRow {
  return {
    id: doc._id?.toString?.() ?? doc.slug,
    name: doc.name,
    slug: doc.slug,
    createdAt: doc.created_at ?? doc.createdAt,
  }
}

export async function listCategories(): Promise<CategoryRow[]> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const db = await getCatalogDb()
  const rows = await db.collection<CategoryDoc>('categories').find().sort({ name: 1 }).toArray()
  return rows.map(mapCategory)
}

export async function countProductsByCategorySlug(): Promise<Map<string, number>> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const db = await getCatalogDb()
  const rows = await db
    .collection('products')
    .aggregate([
      { $match: { status: { $ne: 'inactive' } } },
      { $group: { _id: '$category_slug', n: { $sum: 1 } } },
    ])
    .toArray()
  const map = new Map<string, number>()
  for (const row of rows) {
    const key = row._id != null && row._id !== '' ? String(row._id) : null
    if (key) map.set(key, typeof row.n === 'number' ? row.n : 0)
  }
  return map
}
