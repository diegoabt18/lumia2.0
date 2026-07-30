import type { H3Event } from 'h3'
import type { PromotionEntity } from '../domain/promotion'
import type { CatalogD1DatabaseSession } from '../../../database/catalog-d1'
import { getCatalogReadSession, persistCatalogBookmark } from './d1-session'

interface PromotionRow {
  id: string
  name: string
  description: string | null
  active: number
  starts_at: string
  ends_at: string
  priority: number
  rules_json: string
}

function parsePromotionRow(row: PromotionRow): PromotionEntity {
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(row.rules_json) as Record<string, unknown>
  } catch {
    parsed = {}
  }

  return {
    _id: undefined,
    name: row.name,
    description: row.description ?? undefined,
    active: row.active === 1,
    starts_at: new Date(row.starts_at),
    ends_at: new Date(row.ends_at),
    priority: row.priority,
    apply_general_discount:
      typeof parsed.apply_general_discount === 'boolean' ? parsed.apply_general_discount : undefined,
    general_percent_off:
      typeof parsed.general_percent_off === 'number' ? parsed.general_percent_off : undefined,
    category_slugs: Array.isArray(parsed.category_slugs)
      ? (parsed.category_slugs as string[])
      : undefined,
    product_entries: Array.isArray(parsed.product_entries)
      ? (parsed.product_entries as PromotionEntity['product_entries'])
      : undefined,
    scope: parsed.scope === 'global' || parsed.scope === 'products' ? parsed.scope : undefined,
    global_percent_off:
      typeof parsed.global_percent_off === 'number' ? parsed.global_percent_off : undefined,
    product_percents:
      parsed.product_percents && typeof parsed.product_percents === 'object'
        ? (parsed.product_percents as Record<string, number>)
        : undefined,
  }
}

export async function findActivePromotionsOnSession(
  session: CatalogD1DatabaseSession,
  at: Date
): Promise<PromotionEntity[]> {
  const iso = at.toISOString()
  const { results } = await session
    .prepare(
      `SELECT id, name, description, active, starts_at, ends_at, priority, rules_json
       FROM promotions
       WHERE active = 1 AND starts_at <= ? AND ends_at >= ?
       ORDER BY priority ASC`
    )
    .bind(iso, iso)
    .all<PromotionRow>()

  return results.map(parsePromotionRow)
}

export async function findActivePromotionsD1(event: H3Event, at: Date): Promise<PromotionEntity[]> {
  const session = getCatalogReadSession(event)
  const promos = await findActivePromotionsOnSession(session, at)
  persistCatalogBookmark(event, session)
  return promos
}
