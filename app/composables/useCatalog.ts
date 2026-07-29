import type { Product } from '#shared/types/product'
import { MOCK_PRODUCTS } from '#shared/mocks/products'

interface ProductsResponse {
  products?: Product[]
  items?: Product[]
  source?: 'mongodb' | 'mock'
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

function paginateMock(page: number, limit: number) {
  const total = MOCK_PRODUCTS.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const skip = (safePage - 1) * limit
  return {
    products: MOCK_PRODUCTS.slice(skip, skip + limit),
    source: 'mock' as const,
    pagination: { page: safePage, limit, total, totalPages },
  }
}

function emptyCatalog(page: number, limit: number) {
  return {
    products: [] as Product[],
    source: 'mongodb' as const,
    pagination: { page, limit, total: 0, totalPages: 1 },
  }
}

/**
 * Catálogo: en desarrollo puede usar mocks si la API falla; en producción solo datos reales.
 */
export function useCatalog() {
  const allowMocks = import.meta.dev

  async function fetchProducts(query: {
    limit?: number
    page?: number
    search?: string
    category?: string
    slugs?: string
    promo?: string
    sort?: string
  } = {}) {
    const page = Math.max(1, query.page ?? 1)
    const limit = Math.max(1, query.limit ?? 12)

    try {
      const res = await $fetch<ProductsResponse>('/api/products', {
        query: {
          limit,
          page,
          search: query.search,
          category: query.category,
          slugs: query.slugs,
          promo: query.promo,
          sort: query.sort,
        },
        timeout: 15_000,
      })
      const list = res.products?.length ? res.products : res.items ?? []
      return {
        products: list,
        source: res.source ?? ('mongodb' as const),
        pagination: res.pagination ?? {
          page,
          limit,
          total: list.length,
          totalPages: 1,
        },
      }
    } catch (e) {
      if (allowMocks) {
        if (query.slugs) {
          const slugSet = new Set(query.slugs.split(',').map((s) => s.trim()).filter(Boolean))
          const list = MOCK_PRODUCTS.filter((p) => slugSet.has(p.slug))
          return {
            products: list,
            source: 'mock' as const,
            pagination: { page: 1, limit: list.length, total: list.length, totalPages: 1 },
          }
        }
        return paginateMock(page, limit)
      }
      throw e
    }
  }

  async function fetchProductBySlug(slug: string) {
    try {
      const res = await $fetch<{ product: Product | null }>(`/api/products/${slug}`, { timeout: 15_000 })
      if (res.product) return { product: res.product, source: 'mongodb' as const }
      return { product: null, source: 'mongodb' as const }
    } catch (e) {
      if (allowMocks) {
        const mock = MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null
        return { product: mock, source: 'mock' as const }
      }
      throw e
    }
  }

  return { fetchProducts, fetchProductBySlug, emptyCatalog }
}
