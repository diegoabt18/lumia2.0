import type { CatalogD1DatabaseSession, CatalogD1PreparedStatement } from '../../../database/catalog-d1'
import type {
  D1CategoryRow,
  D1LegacyOptionRow,
  D1OptionAxisRow,
  D1OptionValueRow,
  D1ProductRow,
  D1PromotionRow,
  D1VariantRow,
} from './catalog-transformer'

const BATCH_SIZE = 50

type BatchCapableSession = CatalogD1DatabaseSession & {
  batch?: (statements: CatalogD1PreparedStatement[]) => Promise<unknown[]>
}

async function runStatements(session: CatalogD1DatabaseSession, statements: CatalogD1PreparedStatement[]) {
  const batchSession = session as BatchCapableSession
  if (typeof batchSession.batch === 'function') {
    for (let i = 0; i < statements.length; i += BATCH_SIZE) {
      await batchSession.batch!(statements.slice(i, i + BATCH_SIZE))
    }
    return
  }

  for (const statement of statements) {
    await statement.run()
  }
}

export async function upsertCategories(session: CatalogD1DatabaseSession, rows: D1CategoryRow[]): Promise<number> {
  const statements = rows.map((row) =>
    session
      .prepare(
        `INSERT INTO categories (slug, name, product_count, synced_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           name = excluded.name,
           product_count = excluded.product_count,
           synced_at = excluded.synced_at`
      )
      .bind(row.slug, row.name, row.productCount, row.syncedAt)
  )
  await runStatements(session, statements)
  return rows.length
}

export async function upsertProducts(session: CatalogD1DatabaseSession, rows: D1ProductRow[]): Promise<number> {
  const statements = rows.map((row) =>
    session
      .prepare(
        `INSERT INTO products (
           slug, mongo_id, name, description, category_slug, brand, status,
           image_path, sales_total_units, average_rating, reviews_count, created_at, synced_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           mongo_id = excluded.mongo_id,
           name = excluded.name,
           description = excluded.description,
           category_slug = excluded.category_slug,
           brand = excluded.brand,
           status = excluded.status,
           image_path = excluded.image_path,
           sales_total_units = excluded.sales_total_units,
           average_rating = excluded.average_rating,
           reviews_count = excluded.reviews_count,
           created_at = excluded.created_at,
           synced_at = excluded.synced_at`
      )
      .bind(
        row.slug,
        row.mongoId,
        row.name,
        row.description,
        row.categorySlug,
        row.brand,
        row.status,
        row.imagePath,
        row.salesTotalUnits,
        row.averageRating,
        row.reviewsCount,
        row.createdAt,
        row.syncedAt
      )
  )
  await runStatements(session, statements)
  return rows.length
}

export async function upsertVariants(session: CatalogD1DatabaseSession, rows: D1VariantRow[]): Promise<number> {
  const statements = rows.map((row) =>
    session
      .prepare(
        `INSERT INTO variants (
           sku, product_slug, price, compare_at_price, currency, options_json, image_path,
           stock, available, is_per_order, option_rules_json, option_value_ids_json, synced_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(sku) DO UPDATE SET
           product_slug = excluded.product_slug,
           price = excluded.price,
           compare_at_price = excluded.compare_at_price,
           currency = excluded.currency,
           options_json = excluded.options_json,
           image_path = excluded.image_path,
           stock = excluded.stock,
           available = excluded.available,
           is_per_order = excluded.is_per_order,
           option_rules_json = excluded.option_rules_json,
           option_value_ids_json = excluded.option_value_ids_json,
           synced_at = excluded.synced_at`
      )
      .bind(
        row.sku,
        row.productSlug,
        row.price,
        row.compareAtPrice,
        row.currency,
        row.optionsJson,
        row.imagePath,
        row.stock,
        row.available,
        row.isPerOrder,
        row.optionRulesJson,
        row.optionValueIdsJson,
        row.syncedAt
      )
  )
  await runStatements(session, statements)
  return rows.length
}

export async function upsertPromotions(session: CatalogD1DatabaseSession, rows: D1PromotionRow[]): Promise<number> {
  const statements = rows.map((row) =>
    session
      .prepare(
        `INSERT INTO promotions (
           id, name, description, active, starts_at, ends_at, priority, rules_json, synced_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           description = excluded.description,
           active = excluded.active,
           starts_at = excluded.starts_at,
           ends_at = excluded.ends_at,
           priority = excluded.priority,
           rules_json = excluded.rules_json,
           synced_at = excluded.synced_at`
      )
      .bind(
        row.id,
        row.name,
        row.description,
        row.active,
        row.startsAt,
        row.endsAt,
        row.priority,
        row.rulesJson,
        row.syncedAt
      )
  )
  await runStatements(session, statements)
  return rows.length
}

export async function replaceOptions(
  session: CatalogD1DatabaseSession,
  axes: D1OptionAxisRow[],
  values: D1OptionValueRow[],
  legacy: D1LegacyOptionRow[]
): Promise<number> {
  await session.prepare('DELETE FROM product_option_values').run()
  await session.prepare('DELETE FROM product_option_axes').run()
  await session.prepare('DELETE FROM product_options_legacy').run()

  const axisStatements = axes.map((row) =>
    session
      .prepare(
        `INSERT INTO product_option_axes (id, product_slug, product_mongo_id, name, position, synced_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(row.id, row.productSlug, row.productMongoId, row.name, row.position, row.syncedAt)
  )
  await runStatements(session, axisStatements)

  const valueStatements = values.map((row) =>
    session
      .prepare(
        `INSERT INTO product_option_values (id, axis_id, value, slug, position, synced_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(row.id, row.axisId, row.value, row.slug, row.position, row.syncedAt)
  )
  await runStatements(session, valueStatements)

  const legacyStatements = legacy.map((row) =>
    session
      .prepare(
        `INSERT INTO product_options_legacy (product_slug, name, values_json, synced_at)
         VALUES (?, ?, ?, ?)`
      )
      .bind(row.productSlug, row.name, row.valuesJson, row.syncedAt)
  )
  await runStatements(session, legacyStatements)

  return axes.length + values.length + legacy.length
}

export async function countD1CatalogEntities(session: CatalogD1DatabaseSession): Promise<{
  categories: number
  products: number
  variants: number
  promotions: number
  optionAxes: number
  optionValues: number
  legacyOptions: number
}> {
  async function count(table: string): Promise<number> {
    const row = await session.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>()
    return row?.n ?? 0
  }

  const [categories, products, variants, promotions, optionAxes, optionValues, legacyOptions] =
    await Promise.all([
      count('categories'),
      count('products'),
      count('variants'),
      count('promotions'),
      count('product_option_axes'),
      count('product_option_values'),
      count('product_options_legacy'),
    ])

  return { categories, products, variants, promotions, optionAxes, optionValues, legacyOptions }
}

export async function setMigrationMeta(
  session: CatalogD1DatabaseSession,
  key: string,
  value: string
): Promise<void> {
  await session
    .prepare(
      `INSERT INTO migration_meta (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`
    )
    .bind(key, value)
    .run()
}
