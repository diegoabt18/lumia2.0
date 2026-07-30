import type { PromotionEntity } from '../../catalog/domain/promotion'
import type { CategoryDoc } from '../../catalog/infrastructure/category.repository'
import type { ProductDoc, VariantDoc } from '../../catalog/infrastructure/product.repository'

export interface MongoOptionAxisDoc {
  _id?: { toString(): string }
  product_id: { toString(): string }
  name: string
  position: number
}

export interface MongoOptionValueDoc {
  _id?: { toString(): string }
  option_id: { toString(): string }
  value: string
  slug: string
  position: number
}

export interface MongoLegacyOptionDoc {
  _id?: { toString(): string }
  product_slug: string
  name: string
  values: string[]
}

export interface MongoCatalogSnapshot {
  categories: CategoryDoc[]
  products: ProductDoc[]
  variants: VariantDoc[]
  promotions: PromotionEntity[]
  optionAxes: MongoOptionAxisDoc[]
  optionValues: MongoOptionValueDoc[]
  legacyOptions: MongoLegacyOptionDoc[]
  productCountsByCategory: Map<string, number>
}

async function getDb() {
  const { getCatalogDb } = await import('../../../database/catalog')
  return getCatalogDb()
}

export async function loadMongoCatalogSnapshot(): Promise<MongoCatalogSnapshot> {
  const db = await getDb()

  const [categories, products, variants, promotions, optionAxes, optionValues, legacyOptions, countRows] =
    await Promise.all([
      db.collection<CategoryDoc>('categories').find().sort({ name: 1 }).toArray(),
      db.collection<ProductDoc>('products').find().toArray(),
      db.collection<VariantDoc>('variants').find().toArray(),
      db.collection<PromotionEntity>('promotions').find().toArray(),
      db.collection<MongoOptionAxisDoc>('product_option_axes').find().toArray(),
      db.collection<MongoOptionValueDoc>('product_option_values').find().toArray(),
      db.collection<MongoLegacyOptionDoc>('product_options').find().toArray(),
      db
        .collection('products')
        .aggregate<{ _id: string | null; n: number }>([
          { $match: { status: { $ne: 'inactive' } } },
          { $group: { _id: '$category_slug', n: { $sum: 1 } } },
        ])
        .toArray(),
    ])

  const productCountsByCategory = new Map<string, number>()
  for (const row of countRows) {
    const key = row._id != null && row._id !== '' ? String(row._id) : null
    if (key) productCountsByCategory.set(key, row.n)
  }

  return {
    categories,
    products,
    variants,
    promotions,
    optionAxes,
    optionValues,
    legacyOptions,
    productCountsByCategory,
  }
}

export async function countMongoCatalogEntities(): Promise<{
  categories: number
  products: number
  variants: number
  promotions: number
  optionAxes: number
  optionValues: number
  legacyOptions: number
}> {
  const db = await getDb()
  const [categories, products, variants, promotions, optionAxes, optionValues, legacyOptions] =
    await Promise.all([
      db.collection('categories').countDocuments(),
      db.collection('products').countDocuments(),
      db.collection('variants').countDocuments(),
      db.collection('promotions').countDocuments(),
      db.collection('product_option_axes').countDocuments(),
      db.collection('product_option_values').countDocuments(),
      db.collection('product_options').countDocuments(),
    ])

  return { categories, products, variants, promotions, optionAxes, optionValues, legacyOptions }
}
