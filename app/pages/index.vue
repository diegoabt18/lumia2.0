<template>
  <div>
    <HomeHero />
    <HomeFeaturedProducts :items="featured" :loading="pending" />
    <HomeCategoryGrid />
    <HomeBrandStory />
    <HomeBenefits />
    <HomeTestimonials />
    <HomeInstaGallery />
    <HomeNewsletterSection />
  </div>
</template>

<script setup lang="ts">
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

const { data, pending } = await useAsyncData('home-featured', () =>
  catalog.fetchProducts({ limit: 6, page: 1 })
)

const featured = computed(() => data.value?.products.slice(0, 6) ?? [])
</script>
