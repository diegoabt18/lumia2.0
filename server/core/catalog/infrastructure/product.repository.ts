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
  average_rating?: number
  reviews_count?: number
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
  is_per_order?: boolean
  option_rules?: Array<{
    option_id: { toString(): string }
    allowed_value_ids: Array<{ toString(): string }>
  }>
  option_value_ids?: Array<{ toString(): string }>
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
          is_per_order: { $ifNull: [{ $arrayElemAt: ['$inventory.is_per_order', 0] }, false] },
        },
      },
      { $sort: { price: 1 } },
    ],
    as: 'variants',
  },
} as const

function searchFilter(search?: string, categorySlugs?: string[]): Record<string, unknown> {
  const s = search?.trim()
  const base: Record<string, unknown> = { status: { $ne: 'inactive' } }
  if (categorySlugs?.length) base.category_slug = { $in: categorySlugs }
  if (!s) return base
  return {
    ...base,
    $or: [{ name: new RegExp(s, 'i') }, { slug: new RegExp(s, 'i') }],
  }
}

function mapVariant(v: VariantDoc): ProductVariant {
  const available = typeof v.available === 'number' ? v.available : undefined
  const quantity = typeof v.stock === 'number' ? v.stock : available
  const optionRules = v.option_rules?.length
    ? v.option_rules.map((r) => ({
        optionId: r.option_id.toString(),
        allowedValueIds: r.allowed_value_ids.map((x) => x.toString()),
      }))
    : undefined
  return {
    id: v._id?.toString?.() ?? v.sku,
    productSlug: v.product_slug,
    sku: v.sku,
    options: v.options ?? {},
    optionRules,
    price: v.price,
    compareAtPrice: v.compare_at_price,
    salePrice: v.price,
    currency: v.currency ?? 'COP',
    quantity,
    stock: quantity,
    available,
    imagePath: v.image_path ?? null,
    isMadeToOrder: v.is_per_order === true,
  }
}

async function enrichProductDetail(product: Product, rawVariants: VariantDoc[], productId: string) {
  const {
    listAxesWithValuesByProductId,
    listLegacyOptionsByProductSlug,
    buildValueToOptionMap,
  } = await import('./catalog-options')
  const { groupValueIdsByOption } = await import('../application/variant-option-rules')

  const axes = await listAxesWithValuesByProductId(productId)
  if (axes.length) {
    product.optionAxes = axes
    product.optionsFormat = 'normalized'
    const valueMap = await buildValueToOptionMap(productId)
    for (let i = 0; i < (product.variants?.length ?? 0); i++) {
      const raw = rawVariants[i]
      const mapped = product.variants![i]
      if (!raw || !mapped) continue
      if (!mapped.optionRules?.length && raw.option_value_ids?.length) {
        mapped.optionRules = groupValueIdsByOption(
          raw.option_value_ids.map((x) => x.toString()),
          valueMap
        )
      }
      if (raw.is_per_order === true) mapped.isMadeToOrder = true
    }
    return
  }

  const legacy = await listLegacyOptionsByProductSlug(product.slug)
  if (legacy.length) {
    product.options = legacy
    product.optionsFormat = 'legacy'
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
    averageRating: typeof doc.average_rating === 'number' ? doc.average_rating : undefined,
    reviewsCount: typeof doc.reviews_count === 'number' ? doc.reviews_count : undefined,
  }
}

export async function listProducts(options: {
  limit?: number
  skip?: number
  search?: string
  categorySlugs?: string[]
}): Promise<Product[]> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const { findActivePromotionsCached } = await import('../../../utils/active-promotions-cache')
  const { applyPromotionsToProduct } = await import('../../pricing/apply-product-promotions')
  const db = await getCatalogDb()
  const limit = Math.min(options.limit ?? 20, 100)
  const skip = options.skip ?? 0

  const [rows, topSlugs, promotions] = await Promise.all([
    db
      .collection<ProductDoc>('products')
      .aggregate([
        { $match: searchFilter(options.search, options.categorySlugs) },
        { $sort: { created_at: -1 } },
        { $skip: skip },
        { $limit: limit },
        VARIANTS_LOOKUP,
      ])
      .toArray(),
    findTopSellingSlugs(8),
    findActivePromotionsCached(),
  ])

  const topSet = new Set(topSlugs)
  const now = new Date()

  return rows.map((row) => {
    let product = mapProduct(row as ProductDoc, (row as { variants?: VariantDoc[] }).variants ?? [])
    product = applyPromotionsToProduct(product, promotions, now)
    if (topSet.has(product.slug)) product.salesBadge = 'bestseller'
    else if ((row as ProductDoc).sales_total_units != null && (row as ProductDoc).sales_total_units! >= 3) {
      product.salesBadge = 'popular'
    }
    return product
  })
}

export async function countProducts(search?: string, categorySlugs?: string[]): Promise<number> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const db = await getCatalogDb()
  return db.collection('products').countDocuments(searchFilter(search, categorySlugs))
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { getCatalogDb } = await import('../../../database/catalog')
  const { findActivePromotionsCached } = await import('../../../utils/active-promotions-cache')
  const { applyPromotionsToProduct } = await import('../../pricing/apply-product-promotions')
  const db = await getCatalogDb()

  const [rows, topSlugs, promotions] = await Promise.all([
    db
      .collection<ProductDoc>('products')
      .aggregate([
        { $match: { slug, status: { $ne: 'inactive' } } },
        { $limit: 1 },
        VARIANTS_LOOKUP,
      ])
      .toArray(),
    findTopSellingSlugs(8),
    findActivePromotionsCached(),
  ])

  const row = rows[0]
  if (!row) return null

  const rawVariants = (row as { variants?: VariantDoc[] }).variants ?? []
  let product = mapProduct(row as ProductDoc, rawVariants)
  const productId = (row as ProductDoc)._id?.toString?.() ?? product.id
  await enrichProductDetail(product, rawVariants, productId)
  product = applyPromotionsToProduct(product, promotions, new Date())
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
