import type { H3Event } from 'h3'
import type { Product } from '#shared/types/product'
import type { ResolvedCatalogSource } from '#shared/types/catalog-source'
import type { CatalogSort } from '../catalog-listing'
import { isCatalogDbConfigured } from '../../../database/catalog'
import { isCatalogD1Bound, pingCatalogD1 } from '../../../database/catalog-d1'
import {
  getConfiguredCatalogSourceMode,
  resolveCatalogSourceForEventAsync,
} from '../../../utils/catalog-source'
import type { CategoryRow } from '../infrastructure/category.repository'

async function resolveSource(event?: H3Event): Promise<ResolvedCatalogSource> {
  const mode = getConfiguredCatalogSourceMode()

  if (mode === 'd1') {
    return 'd1'
  }

  if (!event) {
    if (mode === 'auto' && !isCatalogDbConfigured()) return 'd1'
    return isCatalogDbConfigured() ? 'mongo' : 'd1'
  }

  return resolveCatalogSourceForEventAsync(event)
}

function warnMongoCatalogRead(operation: string) {
  console.warn(`[catalog-reader] ${operation} → MongoDB (revisa NUXT_CATALOG_SOURCE y sync D1)`)
}

export async function getResolvedCatalogSource(event: H3Event): Promise<ResolvedCatalogSource> {
  return resolveCatalogSourceForEventAsync(event)
}

export function isCatalogReadConfigured(event?: H3Event): boolean {
  const mode = getConfiguredCatalogSourceMode()
  if (mode === 'mongo') return isCatalogDbConfigured()
  if (mode === 'd1') return event ? isCatalogD1Bound(event) : false
  return isCatalogDbConfigured() || Boolean(event && isCatalogD1Bound(event))
}

export async function listProductsPage(
  options: {
    limit?: number
    skip?: number
    search?: string
    categorySlugs?: string[]
    productSlugs?: string[]
    sort?: CatalogSort
  },
  event?: H3Event
): Promise<{ products: Product[]; total: number }> {
  const source = await resolveSource(event)

  if (source === 'd1') {
    if (!event) {
      throw createError({
        statusCode: 503,
        message: 'Catálogo D1 requiere contexto de petición (event).',
      })
    }
    if (!isCatalogD1Bound(event)) {
      throw createError({
        statusCode: 503,
        message: 'Catálogo edge (D1) no disponible en este Worker.',
      })
    }
    const { listProductsPageD1 } = await import('../infrastructure/product-d1.repository')
    return listProductsPageD1(event, options)
  }

  warnMongoCatalogRead('listProductsPage')
  const { listProductsPage: listMongo } = await import('../infrastructure/product.repository')
  return listMongo(options)
}

export async function getProductBySlug(slug: string, event?: H3Event): Promise<Product | null> {
  const source = await resolveSource(event)

  if (source === 'd1') {
    if (!event || !isCatalogD1Bound(event)) {
      throw createError({ statusCode: 503, message: 'Catálogo edge (D1) no disponible.' })
    }
    const { getProductBySlugD1 } = await import('../infrastructure/product-d1.repository')
    return getProductBySlugD1(event, slug)
  }

  warnMongoCatalogRead('getProductBySlug')
  const { getProductBySlug: getMongo } = await import('../infrastructure/product.repository')
  return getMongo(slug)
}

export async function listCategories(event?: H3Event): Promise<CategoryRow[]> {
  const source = await resolveSource(event)

  if (source === 'd1') {
    if (!event || !isCatalogD1Bound(event)) {
      throw createError({ statusCode: 503, message: 'Catálogo edge (D1) no disponible.' })
    }
    const { listCategoriesD1 } = await import('../infrastructure/category-d1.repository')
    return listCategoriesD1(event)
  }
  warnMongoCatalogRead('listCategories')
  const { listCategories: listMongo } = await import('../infrastructure/category.repository')
  return listMongo()
}

export async function countProductsByCategorySlug(event?: H3Event): Promise<Map<string, number>> {
  const source = await resolveSource(event)

  if (source === 'd1') {
    if (!event) {
      const { countProductsByCategorySlug: countMongo } = await import(
        '../infrastructure/category.repository'
      )
      return countMongo()
    }
    const { countProductsByCategorySlugD1 } = await import('../infrastructure/category-d1.repository')
    return countProductsByCategorySlugD1(event)
  }

  const { countProductsByCategorySlug: countMongo } = await import(
    '../infrastructure/category.repository'
  )
  return countMongo()
}

export async function getCatalogHealth(event: H3Event): Promise<{
  source: ResolvedCatalogSource
  mongoConfigured: boolean
  d1Bound: boolean
  d1Connected: boolean
  d1HasData: boolean
}> {
  const source = await resolveSource(event)
  const d1Ping = await pingCatalogD1(event)
  let d1HasData = false

  if (d1Ping.connected && isCatalogD1Bound(event)) {
    try {
      const { countProductsD1 } = await import('../infrastructure/product-d1.repository')
      d1HasData = (await countProductsD1(event)) > 0
    } catch {
      d1HasData = false
    }
  }

  return {
    source,
    mongoConfigured: isCatalogDbConfigured(),
    d1Bound: d1Ping.bound,
    d1Connected: d1Ping.connected,
    d1HasData,
  }
}
