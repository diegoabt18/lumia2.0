<template>
  <section class="bg-lumia-canvas py-16 md:py-24">
    <BaseContainer>
      <div class="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">Selección</p>
          <h2 class="mt-3 font-display text-3xl font-medium text-lumia-ink md:text-4xl">Piezas destacadas</h2>
        </div>
        <NuxtLink
          to="/products"
          class="text-sm font-medium text-lumia-ink/60 underline-offset-4 transition-colors hover:text-lumia-gold"
        >
          Ver todo el catálogo →
        </NuxtLink>
      </div>

      <div v-if="loading" class="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 6" :key="n" class="animate-pulse overflow-hidden rounded-xl bg-lumia-beige/50">
          <div class="aspect-[3/4] bg-lumia-beige" />
          <div class="space-y-3 p-4">
            <div class="mx-auto h-4 w-2/3 rounded bg-lumia-beige" />
            <div class="mx-auto h-3 w-1/3 rounded bg-lumia-beige/80" />
          </div>
        </div>
      </div>

      <div v-else class="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <ProductCardPremium
          v-for="(p, i) in items"
          :key="p.id"
          :product="p"
          :sales-badge="p.salesBadge ?? null"
          :rating="devRating ? 4 + (i % 2) * 0.5 : null"
        />
      </div>

      <p v-if="!loading && !items.length" class="mt-12 text-center text-lumia-ink/50">
        Pronto tendremos nuevas piezas en esta vitrina.
      </p>
    </BaseContainer>
  </section>
</template>

<script setup lang="ts">
import type { Product } from '#shared/types/product'

withDefaults(
  defineProps<{
    items: Product[]
    loading?: boolean
    devRating?: boolean
  }>(),
  {
    loading: false,
    devRating: true,
  }
)
</script>
