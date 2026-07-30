import type { Product } from '#shared/types/product'

interface ProductsResponse {
  products?: Product[]
  items?: Product[]
  source?: 'd1' | 'mongo'
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

async function fetchWithRetry<T>(url: string, options: { query?: Record<string, unknown>; timeout?: number }): Promise<T> {
  try {
    return (await $fetch(url, { ...options, timeout: options.timeout ?? 8_000 })) as T
  } catch (error) {
    const status = (error as { statusCode?: number })?.statusCode
    if (status !== 503 && status !== 504) throw error
    return (await $fetch(url, { ...options, timeout: 10_000 })) as T
  }
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

    const res = await fetchWithRetry<ProductsResponse>('/api/products', {
      query: {
        limit,
        page,
        search: query.search,
        category: query.category,
        slugs: query.slugs,
        promo: query.promo,
        sort: query.sort,
      },
      timeout: 8_000,
    })

    const list = res.products?.length ? res.products : res.items ?? []
    return {
      products: list,
      source: (res.source ?? 'd1') as 'd1' | 'mongo',
      pagination: res.pagination ?? {
        page,
        limit,
        total: list.length,
        totalPages: 1,
      },
    }
  }

  async function fetchProductBySlug(slug: string) {
    const res = await fetchWithRetry<{ product: Product | null }>(`/api/products/${slug}`, {
      timeout: 8_000,
    })
    return { product: res.product ?? null, source: (res as { source?: 'd1' | 'mongo' }).source ?? 'd1' }
  }

  return { fetchProducts, fetchProductBySlug }
}
