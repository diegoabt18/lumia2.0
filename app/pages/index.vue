<template>
  <div>
    <HomeHero />
    <HomeFeaturedProducts :items="featuredItems" :loading="featuredPending" />
    <HomeCategoryGrid />
    <HomeBrandStory />
    <HomeBenefits />
    <HomeTestimonials />
    <HomeInstaGallery />
    <HomeNewsletterSection />
  </div>
</template>

<script setup lang="ts">
import type { Product } from '#shared/types/product'
import { useCategoryStore } from '~/features/category/stores/category'

useHead({
  title: 'LUMIA — Velas artesanales',
  meta: [
    {
      name: 'description',
      content: 'Velas artesanales elaboradas a mano. Luz cálida y aromas que transforman tu hogar.',
    },
  ],
})

const catalog = useCatalog()
const categoryStore = useCategoryStore()

const { data: featuredData, pending: featuredPending } = await useAsyncData('home-featured', () =>
  catalog.fetchProducts({ limit: 6, page: 1 })
)

await useAsyncData('home-categories', async () => {
  const res = await $fetch<{ categories: Parameters<typeof categoryStore.hydrate>[0] }>('/api/categories')
  if (res.categories?.length) categoryStore.hydrate(res.categories)
  return res.categories
})

const featuredItems = computed((): Product[] => {
  const list = featuredData.value?.products
  return Array.isArray(list) ? list.slice(0, 6) : []
})
</script>
