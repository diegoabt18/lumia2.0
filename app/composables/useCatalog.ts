import type { Product } from '#shared/types/product'

interface ProductsResponse {
  products?: Product[]
  items?: Product[]
  source?: 'api'
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

export function useCatalog() {
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
      source: 'api' as const,
      pagination: res.pagination ?? {
        page,
        limit,
        total: list.length,
        totalPages: 1,
      },
    }
  }

  async function fetchProductBySlug(slug: string) {
    const res = await $fetch<{ product: Product | null; source?: 'api' }>(
      `/api/products/${encodeURIComponent(slug)}`,
      { timeout: 15_000 },
    )
    return { product: res.product ?? null, source: 'api' as const }
  }

  return { fetchProducts, fetchProductBySlug }
}
