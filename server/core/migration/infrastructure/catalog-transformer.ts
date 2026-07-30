import type { PromotionEntity } from '../../catalog/domain/promotion'
import type { CategoryDoc } from '../../catalog/infrastructure/category.repository'
import type { ProductDoc, VariantDoc } from '../../catalog/infrastructure/product.repository'
import type {
  MongoLegacyOptionDoc,
  MongoOptionAxisDoc,
  MongoOptionValueDoc,
} from './mongo-catalog-source'

const nowIso = () => new Date().toISOString()

function isoDate(value: Date | string | undefined | null): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function json(value: unknown): string | null {
  if (value == null) return null
  return JSON.stringify(value)
}

export interface D1CategoryRow {
  slug: string
  name: string
  productCount: number
  syncedAt: string
}

export interface D1ProductRow {
  slug: string
  mongoId: string | null
  name: string
  description: string | null
  categorySlug: string | null
  brand: string | null
  status: string
  imagePath: string | null
  salesTotalUnits: number
  averageRating: number | null
  reviewsCount: number
  createdAt: string | null
  syncedAt: string
}

export interface D1VariantRow {
  sku: string
  productSlug: string
  price: number
  compareAtPrice: number | null
  currency: string
  optionsJson: string | null
  imagePath: string | null
  stock: number | null
  available: number | null
  isPerOrder: number
  optionRulesJson: string | null
  optionValueIdsJson: string | null
  syncedAt: string
}

export interface D1PromotionRow {
  id: string
  name: string
  description: string | null
  active: number
  startsAt: string
  endsAt: string
  priority: number
  rulesJson: string
  syncedAt: string
}

export interface D1OptionAxisRow {
  id: string
  productSlug: string
  productMongoId: string | null
  name: string
  position: number
  syncedAt: string
}

export interface D1OptionValueRow {
  id: string
  axisId: string
  value: string
  slug: string | null
  position: number
  syncedAt: string
}

export interface D1LegacyOptionRow {
  productSlug: string
  name: string
  valuesJson: string
  syncedAt: string
}

export function transformCategories(
  docs: CategoryDoc[],
  productCountsByCategory: Map<string, number>
): D1CategoryRow[] {
  const syncedAt = nowIso()
  return docs.map((doc) => ({
    slug: doc.slug,
    name: doc.name,
    productCount: productCountsByCategory.get(doc.slug) ?? 0,
    syncedAt,
  }))
}

export function transformProducts(docs: ProductDoc[]): D1ProductRow[] {
  const syncedAt = nowIso()
  return docs.map((doc) => ({
    slug: doc.slug,
    mongoId: doc._id?.toString?.() ?? null,
    name: doc.name,
    description: doc.description ?? null,
    categorySlug: doc.category_slug ?? null,
    brand: doc.brand ?? null,
    status: doc.status ?? 'active',
    imagePath: doc.image_path ?? null,
    salesTotalUnits: doc.sales_total_units ?? 0,
    averageRating: typeof doc.average_rating === 'number' ? doc.average_rating : null,
    reviewsCount: doc.reviews_count ?? 0,
    createdAt: isoDate(doc.created_at),
    syncedAt,
  }))
}

export function transformVariants(docs: VariantDoc[]): D1VariantRow[] {
  const syncedAt = nowIso()
  return docs.map((doc) => {
    const optionRules = doc.option_rules?.length
      ? doc.option_rules.map((rule) => ({
          optionId: rule.option_id.toString(),
          allowedValueIds: rule.allowed_value_ids.map((id) => id.toString()),
        }))
      : null
    const optionValueIds = doc.option_value_ids?.map((id) => id.toString()) ?? null

    return {
      sku: doc.sku,
      productSlug: doc.product_slug,
      price: doc.price,
      compareAtPrice: doc.compare_at_price ?? null,
      currency: doc.currency ?? 'COP',
      optionsJson: json(doc.options),
      imagePath: doc.image_path ?? null,
      stock: typeof doc.stock === 'number' ? doc.stock : null,
      available: typeof doc.available === 'number' ? doc.available : null,
      isPerOrder: doc.is_per_order === true ? 1 : 0,
      optionRulesJson: json(optionRules),
      optionValueIdsJson: json(optionValueIds),
      syncedAt,
    }
  })
}

export function transformPromotions(docs: PromotionEntity[]): D1PromotionRow[] {
  const syncedAt = nowIso()
  return docs.map((doc) => ({
    id: doc._id?.toString?.() ?? doc.name,
    name: doc.name,
    description: doc.description ?? null,
    active: doc.active ? 1 : 0,
    startsAt: isoDate(doc.starts_at) ?? syncedAt,
    endsAt: isoDate(doc.ends_at) ?? syncedAt,
    priority: doc.priority ?? 0,
    rulesJson: JSON.stringify({
      name: doc.name,
      description: doc.description,
      active: doc.active,
      starts_at: isoDate(doc.starts_at),
      ends_at: isoDate(doc.ends_at),
      priority: doc.priority,
      apply_general_discount: doc.apply_general_discount,
      general_percent_off: doc.general_percent_off,
      category_slugs: doc.category_slugs,
      product_entries: doc.product_entries,
      scope: doc.scope,
      global_percent_off: doc.global_percent_off,
      product_percents: doc.product_percents,
    }),
    syncedAt,
  }))
}

export function transformOptionAxes(
  docs: MongoOptionAxisDoc[],
  slugByMongoId: Map<string, string>
): D1OptionAxisRow[] {
  const syncedAt = nowIso()
  const rows: D1OptionAxisRow[] = []

  for (const doc of docs) {
    const productMongoId = doc.product_id.toString()
    const productSlug = slugByMongoId.get(productMongoId)
    if (!productSlug || !doc._id) continue
    rows.push({
      id: doc._id.toString(),
      productSlug,
      productMongoId,
      name: doc.name,
      position: doc.position ?? 0,
      syncedAt,
    })
  }

  return rows
}

export function transformOptionValues(docs: MongoOptionValueDoc[], axisIds: Set<string>): D1OptionValueRow[] {
  const syncedAt = nowIso()
  const rows: D1OptionValueRow[] = []

  for (const doc of docs) {
    const axisId = doc.option_id.toString()
    if (!axisIds.has(axisId) || !doc._id) continue
    rows.push({
      id: doc._id.toString(),
      axisId,
      value: doc.value,
      slug: doc.slug ?? null,
      position: doc.position ?? 0,
      syncedAt,
    })
  }

  return rows
}

export function transformLegacyOptions(docs: MongoLegacyOptionDoc[]): D1LegacyOptionRow[] {
  const syncedAt = nowIso()
  return docs.map((doc) => ({
    productSlug: doc.product_slug,
    name: doc.name,
    valuesJson: JSON.stringify(doc.values ?? []),
    syncedAt,
  }))
}

export function buildSlugByMongoId(products: ProductDoc[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const product of products) {
    const id = product._id?.toString?.()
    if (id) map.set(id, product.slug)
  }
  return map
}
