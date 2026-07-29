import type { Product } from '#shared/types/product'

interface ProductsResponse {
  products?: Product[]
  items?: Product[]
  source?: 'mongodb'
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
      source: 'mongodb' as const,
      pagination: res.pagination ?? {
        page,
        limit,
        total: list.length,
        totalPages: 1,
      },
    }
  }

  async function fetchProductBySlug(slug: string) {
    const res = await $fetch<{ product: Product | null }>(`/api/products/${slug}`, { timeout: 15_000 })
    return { product: res.product ?? null, source: 'mongodb' as const }
  }

  return { fetchProducts, fetchProductBySlug }
}
