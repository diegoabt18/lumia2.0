import type { Product } from '#shared/types/product'
import { MOCK_PRODUCTS } from '#shared/mocks/products'

interface ProductsResponse {
  products?: Product[]
  items?: Product[]
  source?: 'mongodb' | 'mock'
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

/**
 * Catálogo con fallback automático a mocks si MongoDB no está configurado o falla.
 */
export function useCatalog() {
  async function fetchProducts(query: { limit?: number; page?: number; search?: string } = {}) {
    try {
      const res = await $fetch<ProductsResponse>('/api/products', { query })
      const list = res.products?.length ? res.products : res.items ?? []
      if (list.length) {
        return { products: list, source: res.source ?? 'mongodb' as const, pagination: res.pagination }
      }
    } catch {
      /* fallback below */
    }
    return {
      products: MOCK_PRODUCTS.slice(0, query.limit ?? MOCK_PRODUCTS.length),
      source: 'mock' as const,
      pagination: undefined,
    }
  }

  async function fetchProductBySlug(slug: string) {
    try {
      const res = await $fetch<{ product: Product | null }>(`/api/products/${slug}`)
      if (res.product) return { product: res.product, source: 'mongodb' as const }
    } catch {
      /* fallback */
    }
    const mock = MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null
    return { product: mock, source: 'mock' as const }
  }

  return { fetchProducts, fetchProductBySlug }
}
