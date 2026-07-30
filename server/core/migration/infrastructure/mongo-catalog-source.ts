import type { PromotionEntity } from '../../catalog/domain/promotion'
import type { CategoryDoc } from '../../catalog/infrastructure/category.repository'
import type { ProductDoc, VariantDoc } from '../../catalog/infrastructure/product.repository'
import type { InventorySummary } from '../../catalog/application/resolve-variant-stock'
import { loadInventoryBySku, loadInventoryForSkus } from '../../catalog/infrastructure/inventory-summary.repository'

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
  inventoryBySku: Map<string, InventorySummary>
}

async function getDb() {
  const { getCatalogDb } = await import('../../../database/catalog')
  return getCatalogDb()
}

export async function loadMongoCatalogSnapshot(): Promise<MongoCatalogSnapshot> {
  const db = await getDb()

  const [categories, products, variants, promotions, optionAxes, optionValues, legacyOptions, countRows, inventoryBySku] =
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
      loadInventoryBySku(db),
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
    inventoryBySku,
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

export interface MongoProductBundle {
  product: ProductDoc
  variants: VariantDoc[]
  optionAxes: MongoOptionAxisDoc[]
  optionValues: MongoOptionValueDoc[]
  legacyOptions: MongoLegacyOptionDoc[]
  inventoryBySku: Map<string, InventorySummary>
  category: CategoryDoc | null
}

export async function loadMongoProductBySlug(slug: string): Promise<MongoProductBundle | null> {
  const db = await getDb()
  const product = await db.collection<ProductDoc>('products').findOne({ slug })
  if (!product) return null

  const variants = await db.collection<VariantDoc>('variants').find({ product_slug: slug }).toArray()
  const productId = product._id

  const [optionAxes, legacyOptions, inventoryBySku, category] = await Promise.all([
    productId
      ? db.collection<MongoOptionAxisDoc>('product_option_axes').find({ product_id: productId }).toArray()
      : Promise.resolve([] as MongoOptionAxisDoc[]),
    db.collection<MongoLegacyOptionDoc>('product_options').find({ product_slug: slug }).toArray(),
    loadInventoryForSkus(
      db,
      variants.map((v) => v.sku)
    ),
    product.category_slug
      ? db.collection<CategoryDoc>('categories').findOne({ slug: product.category_slug })
      : Promise.resolve(null),
  ])

  const axisObjectIds = optionAxes.flatMap((a) => (a._id ? [a._id] : []))
  const optionValues =
    axisObjectIds.length > 0
      ? await db
          .collection<MongoOptionValueDoc>('product_option_values')
          .find({ option_id: { $in: axisObjectIds } })
          .toArray()
      : []

  return {
    product,
    variants,
    optionAxes,
    optionValues,
    legacyOptions,
    inventoryBySku,
    category,
  }
}
