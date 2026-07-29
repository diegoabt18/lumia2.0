<template>
  <section id="colecciones" class="scroll-mt-24 bg-lumia-beige/35 py-16 md:py-24">
    <BaseContainer>
      <div class="mx-auto max-w-2xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">Colecciones</p>
        <h2 class="mt-3 font-display text-3xl font-medium text-lumia-ink md:text-4xl">Explora por categoría</h2>
      </div>
      <div v-if="displayCategories.length" class="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <NuxtLink
          v-for="cat in displayCategories"
          :key="cat.slug"
          :to="`/products?category=${encodeURIComponent(cat.slug)}`"
          class="group relative overflow-hidden rounded-2xl border border-lumia-ink/8 bg-lumia-canvas p-6 shadow-soft transition hover:border-lumia-gold/35 hover:shadow-soft-lg"
        >
          <p class="font-display text-xl text-lumia-ink transition group-hover:text-lumia-gold">{{ cat.name }}</p>
          <p v-if="cat.productCount != null" class="mt-2 text-xs text-lumia-ink/45">
            {{ cat.productCount }} {{ cat.productCount === 1 ? 'producto' : 'productos' }}
          </p>
        </NuxtLink>
      </div>
      <div v-else class="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div v-for="n in 4" :key="n" class="h-24 animate-pulse rounded-2xl bg-lumia-beige/60" />
      </div>
    </BaseContainer>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCategoryStore } from '~/features/category/stores/category'

const store = useCategoryStore()
const { categories } = storeToRefs(store)

const displayCategories = computed(() => categories.value.slice(0, 8))
</script>
