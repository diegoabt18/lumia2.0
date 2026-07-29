import type { Category } from '#shared/types/category'

export function useCategories() {
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  async function fetchCategories() {
    if (loading.value) return categories.value
    loading.value = true
    try {
      const res = await $fetch<{ categories: Category[] }>('/api/categories')
      categories.value = res.categories ?? []
      loaded.value = true
      return categories.value
    } catch {
      categories.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  return { categories, loading, loaded, fetchCategories }
}
