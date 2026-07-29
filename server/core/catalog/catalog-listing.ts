import type { Product } from '#shared/types/product'
import { listProductsPage } from './infrastructure/product.repository'

export type CatalogSort = 'featured' | 'name-asc' | 'price-asc' | 'price-desc'

const MAX_CATALOG_PROCESS = 1000

function productHasPromo(product: Product): boolean {
  return product.variants?.some((v) => (v.promotionPercentOff ?? 0) > 0) ?? false
}

function sortPrice(product: Product): number {
  const prices = product.variants?.map((v) => v.salePrice ?? v.price) ?? []
  if (prices.length) return Math.min(...prices)
  return product.fromPrice ?? 0
}

function sortProducts(products: Product[], sort: CatalogSort): Product[] {
  const list = [...products]
  switch (sort) {
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name, 'es'))
      break
    case 'price-asc':
      list.sort((a, b) => sortPrice(a) - sortPrice(b))
      break
    case 'price-desc':
      list.sort((a, b) => sortPrice(b) - sortPrice(a))
      break
    default:
      break
  }
  return list
}

export async function listCatalogProducts(options: {
  limit: number
  skip: number
  search?: string
  categorySlugs?: string[]
  productSlugs?: string[]
  promoOnly?: boolean
  sort?: CatalogSort
}): Promise<{ products: Product[]; total: number }> {
  const sort = options.sort ?? 'featured'
  const needsPostProcess = Boolean(options.promoOnly) || sort !== 'featured'

  if (!needsPostProcess) {
    return listProductsPage({
      limit: options.limit,
      skip: options.skip,
      search: options.search,
      categorySlugs: options.categorySlugs,
      productSlugs: options.productSlugs,
    })
  }

  const { products } = await listProductsPage({
    limit: MAX_CATALOG_PROCESS,
    skip: 0,
    search: options.search,
    categorySlugs: options.categorySlugs,
    productSlugs: options.productSlugs,
  })

  let processed = options.promoOnly ? products.filter(productHasPromo) : products
  processed = sortProducts(processed, sort)

  const total = processed.length
  const pageItems = processed.slice(options.skip, options.skip + options.limit)
  return { products: pageItems, total }
}
