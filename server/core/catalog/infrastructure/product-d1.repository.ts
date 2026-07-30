import type { H3Event } from 'h3'
import type { Product, ProductVariant } from '#shared/types/product'
import type { PromotionEntity } from '../domain/promotion'
import {
  buildValueToOptionMapD1,
  listAxesWithValuesByProductSlugD1,
  listLegacyOptionsByProductSlugD1,
} from './catalog-options-d1'
import { findTopSellingSlugsD1 } from './category-d1.repository'
import { getCatalogReadSession, persistCatalogBookmark } from './d1-session'
import { findActivePromotionsD1 } from './promotion-d1.repository'

interface ProductD1Row {
  slug: string
  mongo_id: string | null
  name: string
  description: string | null
  category_slug: string | null
  brand: string | null
  status: string
  image_path: string | null
  sales_total_units: number
  average_rating: number | null
  reviews_count: number
  created_at: string | null
}

interface VariantD1Row {
  sku: string
  product_slug: string
  price: number
  compare_at_price: number | null
  currency: string
  options_json: string | null
  image_path: string | null
  stock: number | null
  available: number | null
  is_per_order: number
  option_rules_json: string | null
  option_value_ids_json: string | null
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function mapVariant(row: VariantD1Row): ProductVariant {
  const available = typeof row.available === 'number' ? row.available : undefined
  const quantity = typeof row.stock === 'number' ? row.stock : available
  const optionRules = parseJson<Array<{ optionId: string; allowedValueIds: string[] }>>(
    row.option_rules_json
  )

  return {
    id: row.sku,
    productSlug: row.product_slug,
    sku: row.sku,
    options: parseJson<Record<string, string>>(row.options_json) ?? {},
    optionRules: optionRules ?? undefined,
    price: row.price,
    compareAtPrice: row.compare_at_price ?? undefined,
    salePrice: row.price,
    currency: row.currency ?? 'COP',
    quantity,
    stock: quantity,
    available,
    imagePath: row.image_path ?? null,
    isMadeToOrder: row.is_per_order === 1,
  }
}

function mapProduct(row: ProductD1Row, variants: ProductVariant[] = []): Product {
  const fromPrice =
    variants.length > 0 ? Math.min(...variants.map((x) => x.salePrice ?? x.price)) : undefined

  return {
    id: row.mongo_id ?? row.slug,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    categorySlug: row.category_slug ?? undefined,
    fromPrice,
    currency: variants[0]?.currency ?? 'COP',
    imagePath: row.image_path ?? null,
    createdAt: row.created_at ?? undefined,
    variants,
    salesBadge: null,
    averageRating: typeof row.average_rating === 'number' ? row.average_rating : undefined,
    reviewsCount: typeof row.reviews_count === 'number' ? row.reviews_count : undefined,
  }
}

function groupVariantsByProductSlug(rows: VariantD1Row[], maxPerProduct = 4): Map<string, VariantD1Row[]> {
  const map = new Map<string, VariantD1Row[]>()
  for (const row of rows) {
    const list = map.get(row.product_slug)
    if (!list) map.set(row.product_slug, [row])
    else if (list.length < maxPerProduct) list.push(row)
  }
  return map
}

function buildProductListWhere(options: {
  search?: string
  categorySlugs?: string[]
  productSlugs?: string[]
}): { sql: string; params: unknown[] } {
  const clauses = [`status != 'inactive'`]
  const params: unknown[] = []

  if (options.categorySlugs?.length === 1) {
    clauses.push('category_slug = ?')
    params.push(options.categorySlugs[0])
  } else if (options.categorySlugs?.length) {
    clauses.push(`category_slug IN (${options.categorySlugs.map(() => '?').join(', ')})`)
    params.push(...options.categorySlugs)
  }

  if (options.productSlugs?.length) {
    clauses.push(`slug IN (${options.productSlugs.map(() => '?').join(', ')})`)
    params.push(...options.productSlugs)
  }

  const search = options.search?.trim()
  if (search) {
    clauses.push(`(LOWER(name) LIKE ? OR LOWER(slug) LIKE ?)`)
    const pattern = `%${search.toLowerCase()}%`
    params.push(pattern, pattern)
  }

  return { sql: clauses.join(' AND '), params }
}

async function enrichProductDetailD1(event: H3Event, product: Product, rawVariants: VariantD1Row[]) {
  const { groupValueIdsByOption } = await import('../application/variant-option-rules')

  const axes = await listAxesWithValuesByProductSlugD1(event, product.slug)
  if (axes.length) {
    product.optionAxes = axes
    product.optionsFormat = 'normalized'
    const valueMap = await buildValueToOptionMapD1(event, product.slug)
    for (let i = 0; i < (product.variants?.length ?? 0); i++) {
      const raw = rawVariants[i]
      const mapped = product.variants![i]
      if (!raw || !mapped) continue
      const valueIds = parseJson<string[]>(raw.option_value_ids_json)
      if (!mapped.optionRules?.length && valueIds?.length) {
        mapped.optionRules = groupValueIdsByOption(valueIds, valueMap)
      }
      if (raw.is_per_order === 1) mapped.isMadeToOrder = true
    }
    return
  }

  const legacy = await listLegacyOptionsByProductSlugD1(event, product.slug)
  if (legacy.length) {
    product.options = legacy
    product.optionsFormat = 'legacy'
  }
}

let promosCache: { at: number; promos: PromotionEntity[]; eventKey: string } | null = null
const PROMOS_TTL_MS = 5 * 60 * 1000

async function findActivePromotionsCachedD1(event: H3Event): Promise<PromotionEntity[]> {
  const key = 'd1'
  const now = Date.now()
  if (promosCache && promosCache.eventKey === key && now - promosCache.at < PROMOS_TTL_MS) {
    return promosCache.promos
  }
  const promos = await findActivePromotionsD1(event, new Date())
  promosCache = { at: now, promos, eventKey: key }
  return promos
}

export async function listProductsPageD1(
  event: H3Event,
  options: {
    limit?: number
    skip?: number
    search?: string
    categorySlugs?: string[]
    productSlugs?: string[]
  }
): Promise<{ products: Product[]; total: number }> {
  const { applyPromotionsToProduct } = await import('../../pricing/apply-product-promotions')
  const session = getCatalogReadSession(event)
  const limit = Math.min(options.limit ?? 20, 100)
  const skip = options.skip ?? 0
  const { sql, params } = buildProductListWhere(options)

  const [productResult, countRow, topSlugs, promotions] = await Promise.all([
    session
      .prepare(
        `SELECT slug, mongo_id, name, description, category_slug, brand, status, image_path,
                sales_total_units, average_rating, reviews_count, created_at
         FROM products
         WHERE ${sql}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, skip)
      .all<ProductD1Row>(),
    session.prepare(`SELECT COUNT(*) AS n FROM products WHERE ${sql}`).bind(...params).first<{ n: number }>(),
    findTopSellingSlugsD1(event, 8),
    findActivePromotionsCachedD1(event),
  ])

  persistCatalogBookmark(event, session)

  const productRows = productResult.results
  const total = countRow?.n ?? 0
  const slugs = productRows.map((row) => row.slug)

  let variantDocs: VariantD1Row[] = []
  if (slugs.length) {
    const placeholders = slugs.map(() => '?').join(', ')
    const variantSession = getCatalogReadSession(event)
    const { results } = await variantSession
      .prepare(
        `SELECT sku, product_slug, price, compare_at_price, currency, options_json, image_path,
                stock, available, is_per_order, option_rules_json, option_value_ids_json
         FROM variants
         WHERE product_slug IN (${placeholders})
         ORDER BY product_slug ASC, price ASC`
      )
      .bind(...slugs)
      .all<VariantD1Row>()
    persistCatalogBookmark(event, variantSession)
    variantDocs = results
  }

  const variantsBySlug = groupVariantsByProductSlug(variantDocs)
  const topSet = new Set(topSlugs)
  const now = new Date()
  const popularMin = Number(useRuntimeConfig().public.storePopularMinUnits) || 3

  const products = productRows.map((row) => {
    let product = mapProduct(row, (variantsBySlug.get(row.slug) ?? []).map(mapVariant))
    product = applyPromotionsToProduct(product, promotions, now)
    if (topSet.has(product.slug)) product.salesBadge = 'bestseller'
    else if (row.sales_total_units >= popularMin) product.salesBadge = 'popular'
    return product
  })

  return { products, total }
}

export async function getProductBySlugD1(event: H3Event, slug: string): Promise<Product | null> {
  const { applyPromotionsToProduct } = await import('../../pricing/apply-product-promotions')
  const session = getCatalogReadSession(event)

  const [productRow, variantResult, topSlugs, promotions] = await Promise.all([
    session
      .prepare(
        `SELECT slug, mongo_id, name, description, category_slug, brand, status, image_path,
                sales_total_units, average_rating, reviews_count, created_at
         FROM products
         WHERE slug = ? AND status != 'inactive'
         LIMIT 1`
      )
      .bind(slug)
      .first<ProductD1Row>(),
    session
      .prepare(
        `SELECT sku, product_slug, price, compare_at_price, currency, options_json, image_path,
                stock, available, is_per_order, option_rules_json, option_value_ids_json
         FROM variants
         WHERE product_slug = ?
         ORDER BY price ASC`
      )
      .bind(slug)
      .all<VariantD1Row>(),
    findTopSellingSlugsD1(event, 8),
    findActivePromotionsCachedD1(event),
  ])

  persistCatalogBookmark(event, session)

  if (!productRow) return null

  const variantDocs = variantResult.results
  let product = mapProduct(productRow, variantDocs.map(mapVariant))
  await enrichProductDetailD1(event, product, variantDocs)
  product = applyPromotionsToProduct(product, promotions, new Date())

  const popularMin = Number(useRuntimeConfig().public.storePopularMinUnits) || 3
  if (topSlugs.includes(product.slug)) product.salesBadge = 'bestseller'
  else if (productRow.sales_total_units >= popularMin) product.salesBadge = 'popular'

  return product
}

export async function countProductsD1(
  event: H3Event,
  search?: string,
  categorySlugs?: string[]
): Promise<number> {
  const session = getCatalogReadSession(event)
  const { sql, params } = buildProductListWhere({ search, categorySlugs })
  const row = await session.prepare(`SELECT COUNT(*) AS n FROM products WHERE ${sql}`).bind(...params).first<{ n: number }>()
  persistCatalogBookmark(event, session)
  return row?.n ?? 0
}
