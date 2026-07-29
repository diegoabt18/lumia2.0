import type { Product, ProductVariant } from '#shared/types/product'

/** Documento MongoDB — colección `products` */
export interface ProductDoc {
  _id?: { toString(): string }
  name: string
  slug: string
  description?: string
  category_slug?: string
  brand?: string
  status?: 'active' | 'inactive'
  created_at?: Date
  image_path?: string
  sales_total_units?: number
}

/** Documento MongoDB — colección `variants` (post-aggregate) */
export interface VariantDoc {
  _id?: { toString(): string }
  product_slug: string
  sku: string
  options?: Record<string, string>
  price: number
  compare_at_price?: number
  currency?: string
  image_path?: string
  stock?: number
  reserved?: number
  available?: number
}

const VARIANTS_LOOKUP = {
  $lookup: {
    from: 'variants',
    let: { productSlug: '$slug' },
    pipeline: [
      { $match: { $expr: { $eq: ['$product_slug', '$$productSlug'] } } },
      {
        $lookup: {
          from: 'inventory_items',
          localField: 'sku',
          foreignField: 'sku',
          as: 'inventory',
        },
      },
      {
        $addFields: {
          stock: { $sum: '$inventory.quantity' },
          reserved: { $sum: '$inventory.reserved' },
          available: {
            $subtract: [{ $sum: '$inventory.quantity' }, { $sum: '$inventory.reserved' }],
          },
        },
      },
      { $sort: { price: 1 } },
    ],
    as: 'variants',
  },
} as const

function searchFilter(search?: string): Record<string, unknown> {
  const s = search?.trim()
  const base = { status: { $ne: 'inactive' } }
  if (!s) return base
  return {
    ...base,
    $or: [{ name: new RegExp(s, 'i') }, { slug: new RegExp(s, 'i') }],
  }
}

function mapVariant(v: VariantDoc): ProductVariant {
  const available = typeof v.available === 'number' ? v.available : undefined
  const quantity = typeof v.stock === 'number' ? v.stock : available
  return {
    id: v._id?.toString?.() ?? v.sku,
    productSlug: v.product_slug,
    sku: v.sku,
    options: v.options ?? {},
    price: v.price,
    compareAtPrice: v.compare_at_price,
    salePrice: v.price,
    currency: v.currency ?? 'COP',
    quantity,
    stock: quantity,
    available,
    imagePath: v.image_path ?? null,
  }
}

export async function getVariantBySku(sku: string): Promise<(VariantDoc & { product_name?: string }) | null> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const db = await getCatalogDb()
  const variant = await db.collection<VariantDoc>('variants').findOne({ sku })
  if (!variant) return null
  const product = await db
    .collection<ProductDoc>('products')
    .findOne({ slug: variant.product_slug }, { projection: { name: 1 } })
  return { ...variant, product_name: product?.name }
}

function mapProduct(doc: ProductDoc, variants: VariantDoc[] = []): Product {
  const mappedVariants = variants.map(mapVariant)
  const fromPrice =
    mappedVariants.length > 0
      ? Math.min(...mappedVariants.map((x) => x.salePrice ?? x.price))
      : undefined

  return {
    id: doc._id?.toString?.() ?? doc.slug,
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    categorySlug: doc.category_slug,
    fromPrice,
    currency: mappedVariants[0]?.currency ?? 'COP',
    imagePath: doc.image_path ?? null,
    createdAt: doc.created_at?.toISOString?.(),
    variants: mappedVariants,
    salesBadge: null,
  }
}

export async function listProducts(options: {
  limit?: number
  skip?: number
  search?: string
}): Promise<Product[]> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const db = await getCatalogDb()
  const limit = Math.min(options.limit ?? 20, 100)
  const skip = options.skip ?? 0

  const rows = await db
    .collection<ProductDoc>('products')
    .aggregate([
      { $match: searchFilter(options.search) },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limit },
      VARIANTS_LOOKUP,
    ])
    .toArray()

  const topSlugs = await findTopSellingSlugs(8)
  const topSet = new Set(topSlugs)

  return rows.map((row) => {
    const product = mapProduct(row as ProductDoc, (row as { variants?: VariantDoc[] }).variants ?? [])
    if (topSet.has(product.slug)) product.salesBadge = 'bestseller'
    else if ((row as ProductDoc).sales_total_units != null && (row as ProductDoc).sales_total_units! >= 3) {
      product.salesBadge = 'popular'
    }
    return product
  })
}

export async function countProducts(search?: string): Promise<number> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const db = await getCatalogDb()
  return db.collection('products').countDocuments(searchFilter(search))
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const db = await getCatalogDb()

  const rows = await db
    .collection<ProductDoc>('products')
    .aggregate([
      { $match: { slug, status: { $ne: 'inactive' } } },
      { $limit: 1 },
      VARIANTS_LOOKUP,
    ])
    .toArray()

  const row = rows[0]
  if (!row) return null

  const product = mapProduct(row as ProductDoc, (row as { variants?: VariantDoc[] }).variants ?? [])
  const topSlugs = await findTopSellingSlugs(8)
  if (topSlugs.includes(product.slug)) product.salesBadge = 'bestseller'
  else if ((row as ProductDoc).sales_total_units != null && (row as ProductDoc).sales_total_units! >= 3) {
    product.salesBadge = 'popular'
  }
  return product
}

async function findTopSellingSlugs(limit: number): Promise<string[]> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const db = await getCatalogDb()
  const rows = await db
    .collection<ProductDoc>('products')
    .find({ status: { $ne: 'inactive' } })
    .sort({ sales_total_units: -1 })
    .limit(Math.max(1, limit))
    .project({ slug: 1 })
    .toArray()
  return rows.map((r) => r.slug).filter(Boolean)
}
