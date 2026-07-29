import { ObjectId } from 'mongodb'

const AXES = 'product_option_axes'
const VALS = 'product_option_values'

interface ProductOptionAxisEntity {
  _id?: ObjectId
  product_id: ObjectId
  name: string
  position: number
}

interface ProductOptionValueEntity {
  _id?: ObjectId
  option_id: ObjectId
  value: string
  slug: string
  position: number
}

export interface CatalogOptionAxis {
  id: string
  name: string
  position: number
  values: Array<{ id: string; value: string; slug: string; position: number }>
}

export async function listAxesWithValuesByProductId(productId: string): Promise<CatalogOptionAxis[]> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const db = await getCatalogDb()
  let pid: ObjectId
  try {
    pid = new ObjectId(productId)
  } catch {
    return []
  }

  const axes = await db
    .collection<ProductOptionAxisEntity>(AXES)
    .find({ product_id: pid })
    .sort({ position: 1 })
    .toArray()
  if (!axes.length) return []

  const axisIds = axes.map((a) => a._id!)
  const values = await db
    .collection<ProductOptionValueEntity>(VALS)
    .find({ option_id: { $in: axisIds } })
    .sort({ position: 1 })
    .toArray()

  const byAxis = new Map<string, ProductOptionValueEntity[]>()
  for (const v of values) {
    const k = v.option_id.toString()
    if (!byAxis.has(k)) byAxis.set(k, [])
    byAxis.get(k)!.push(v)
  }

  return axes.map((a) => ({
    id: a._id!.toString(),
    name: a.name,
    position: a.position,
    values: (byAxis.get(a._id!.toString()) ?? [])
      .sort((x, y) => x.position - y.position)
      .map((v) => ({
        id: v._id!.toString(),
        value: v.value,
        slug: v.slug,
        position: v.position,
      })),
  }))
}

export async function buildValueToOptionMap(productId: string): Promise<Map<string, string>> {
  const tree = await listAxesWithValuesByProductId(productId)
  const m = new Map<string, string>()
  for (const ax of tree) {
    for (const v of ax.values) {
      m.set(v.id, ax.id)
    }
  }
  return m
}

export async function listLegacyOptionsByProductSlug(
  productSlug: string
): Promise<Array<{ name: string; values: string[] }>> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const db = await getCatalogDb()
  const docs = await db
    .collection<{ name: string; values: string[]; product_slug: string }>('product_options')
    .find({ product_slug: productSlug, values: { $exists: true } })
    .toArray()
  return docs.map((d) => ({ name: d.name, values: d.values ?? [] }))
}
