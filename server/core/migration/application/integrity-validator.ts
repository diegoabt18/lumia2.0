import type { CatalogD1DatabaseSession } from '../../../database/catalog-d1'
import type { IntegrityIssue, IntegrityReport, MigrationCounts } from '#shared/types/migration'
import { countMongoCatalogEntities, loadMongoCatalogSnapshot } from '../infrastructure/mongo-catalog-source'
import { countD1CatalogEntities } from '../infrastructure/d1-catalog-writer'

function compareCounts(mongo: MigrationCounts, d1: MigrationCounts): IntegrityIssue[] {
  const issues: IntegrityIssue[] = []
  const keys: Array<keyof MigrationCounts> = [
    'categories',
    'products',
    'variants',
    'promotions',
    'optionAxes',
    'optionValues',
    'legacyOptions',
  ]

  for (const key of keys) {
    if (mongo[key] !== d1[key]) {
      issues.push({
        code: 'count_mismatch',
        message: `Conteo distinto en ${key}: Mongo=${mongo[key]}, D1=${d1[key]}`,
        details: { entity: key, mongo: mongo[key], d1: d1[key] },
      })
    }
  }

  return issues
}

export async function validateCatalogIntegrity(
  session: CatalogD1DatabaseSession
): Promise<IntegrityReport> {
  const [mongo, d1, snapshot] = await Promise.all([
    countMongoCatalogEntities(),
    countD1CatalogEntities(session),
    loadMongoCatalogSnapshot(),
  ])

  const issues = compareCounts(mongo, d1)

  const productSlugs = new Set(snapshot.products.map((p) => p.slug))
  const orphanVariants = snapshot.variants.filter((v) => !productSlugs.has(v.product_slug))
  if (orphanVariants.length) {
    issues.push({
      code: 'mongo_orphan_variants',
      message: `${orphanVariants.length} variantes en Mongo sin producto padre`,
      details: { sample: orphanVariants.slice(0, 5).map((v) => v.sku) },
    })
  }

  const d1Orphans = await session
    .prepare(
      `SELECT v.sku
       FROM variants v
       LEFT JOIN products p ON p.slug = v.product_slug
       WHERE p.slug IS NULL
       LIMIT 5`
    )
    .all<{ sku: string }>()

  if (d1Orphans.results.length) {
    const total = await session
      .prepare(
        `SELECT COUNT(*) AS n
         FROM variants v
         LEFT JOIN products p ON p.slug = v.product_slug
         WHERE p.slug IS NULL`
      )
      .first<{ n: number }>()

    issues.push({
      code: 'd1_orphan_variants',
      message: `${total?.n ?? d1Orphans.results.length} variantes en D1 sin producto padre`,
      details: { sample: d1Orphans.results.map((r) => r.sku) },
    })
  }

  return { ok: issues.length === 0, issues, mongo, d1 }
}

export async function previewIntegrityFromMongo(): Promise<IntegrityReport> {
  const mongo = await countMongoCatalogEntities()
  const empty: MigrationCounts = {
    categories: 0,
    products: 0,
    variants: 0,
    promotions: 0,
    optionAxes: 0,
    optionValues: 0,
    legacyOptions: 0,
  }

  return {
    ok: true,
    issues: [],
    mongo,
    d1: empty,
  }
}
