import type { H3Event } from 'h3'
import type { CatalogOptionAxis } from './catalog-options'
import { getCatalogReadSession, persistCatalogBookmark } from './d1-session'

export async function listAxesWithValuesByProductSlugD1(
  event: H3Event,
  productSlug: string
): Promise<CatalogOptionAxis[]> {
  const session = getCatalogReadSession(event)
  const { results: axes } = await session
    .prepare(
      `SELECT id, name, position FROM product_option_axes
       WHERE product_slug = ?
       ORDER BY position ASC`
    )
    .bind(productSlug)
    .all<{ id: string; name: string; position: number }>()

  if (!axes.length) {
    persistCatalogBookmark(event, session)
    return []
  }

  const axisIds = axes.map((a) => a.id)
  const placeholders = axisIds.map(() => '?').join(', ')
  const { results: values } = await session
    .prepare(
      `SELECT id, axis_id, value, slug, position FROM product_option_values
       WHERE axis_id IN (${placeholders})
       ORDER BY position ASC`
    )
    .bind(...axisIds)
    .all<{ id: string; axis_id: string; value: string; slug: string | null; position: number }>()

  persistCatalogBookmark(event, session)

  const byAxis = new Map<string, typeof values>()
  for (const value of values) {
    const list = byAxis.get(value.axis_id)
    if (!list) byAxis.set(value.axis_id, [value])
    else list.push(value)
  }

  return axes.map((axis) => ({
    id: axis.id,
    name: axis.name,
    position: axis.position,
    values: (byAxis.get(axis.id) ?? []).map((v) => ({
      id: v.id,
      value: v.value,
      slug: v.slug ?? v.value,
      position: v.position,
    })),
  }))
}

export async function buildValueToOptionMapD1(
  event: H3Event,
  productSlug: string
): Promise<Map<string, string>> {
  const tree = await listAxesWithValuesByProductSlugD1(event, productSlug)
  const map = new Map<string, string>()
  for (const axis of tree) {
    for (const value of axis.values) {
      map.set(value.id, axis.id)
    }
  }
  return map
}

export async function listLegacyOptionsByProductSlugD1(
  event: H3Event,
  productSlug: string
): Promise<Array<{ name: string; values: string[] }>> {
  const session = getCatalogReadSession(event)
  const { results } = await session
    .prepare(
      `SELECT name, values_json FROM product_options_legacy
       WHERE product_slug = ?
       ORDER BY id ASC`
    )
    .bind(productSlug)
    .all<{ name: string; values_json: string }>()

  persistCatalogBookmark(event, session)

  return results.map((row) => {
    let values: string[] = []
    try {
      const parsed = JSON.parse(row.values_json)
      values = Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      values = []
    }
    return { name: row.name, values }
  })
}
