import { defineStore } from 'pinia'
import type { Category } from '#shared/types/category'

const CLIENT_TTL_MS = 15 * 60 * 1000

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const loadedAt = ref(0)
  let inflight: Promise<Category[]> | null = null

  async function fetchCategories(force = false) {
    if (
      !force &&
      categories.value.length > 0 &&
      Date.now() - loadedAt.value < CLIENT_TTL_MS
    ) {
      return categories.value
    }
    if (inflight) return inflight

    inflight = (async () => {
      try {
        const res = await $fetch<{ categories: Category[] }>('/api/categories')
        categories.value = res.categories ?? []
        loadedAt.value = Date.now()
        return categories.value
      } catch {
        return categories.value
      } finally {
        inflight = null
      }
    })()

    return inflight
  }

  function hydrate(next: Category[]) {
    if (!next.length) return
    categories.value = next
    loadedAt.value = Date.now()
  }

  return { categories, fetchCategories, hydrate }
})
