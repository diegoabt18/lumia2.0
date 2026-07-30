import type { H3Event } from 'h3'
import type { ResolvedCatalogSource } from '#shared/types/catalog-source'
import { getResolvedCatalogSource } from '../core/catalog/application/catalog-reader'

export async function setCatalogSourceHeader(event: H3Event): Promise<ResolvedCatalogSource> {
  const source = await getResolvedCatalogSource(event)
  setHeader(event, 'X-Catalog-Source', source)
  return source
}
