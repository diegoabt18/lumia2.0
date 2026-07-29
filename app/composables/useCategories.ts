import type { Category } from '#shared/types/category'
import { storeToRefs } from 'pinia'
import { useCategoryStore } from '~/features/category/stores/category'

export function useCategories() {
  const store = useCategoryStore()
  const { categories } = storeToRefs(store)

  return {
    categories,
    fetchCategories: store.fetchCategories,
    hydrateCategories: store.hydrate,
  }
}

export type { Category }
