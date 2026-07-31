<template>
  <section class="bg-lumia-canvas py-10 md:py-24">
    <BaseContainer>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">Selección</p>
          <h2 class="mt-2 font-display text-2xl font-medium text-lumia-ink sm:mt-3 sm:text-3xl md:text-4xl">
            Piezas destacadas
          </h2>
        </div>
        <NuxtLink
          to="/products"
          class="hidden text-sm font-medium text-lumia-ink/60 underline-offset-4 transition-colors hover:text-lumia-gold sm:inline-flex"
        >
          Ver todo el catálogo →
        </NuxtLink>
      </div>

      <div
        v-if="loading"
        class="mt-6 grid grid-cols-2 gap-x-2 gap-y-4 sm:mt-10 sm:gap-x-6 sm:gap-y-5 lg:mt-12 lg:grid-cols-3 lg:gap-8"
      >
        <div v-for="n in 6" :key="n" class="animate-pulse overflow-hidden rounded-xl bg-lumia-beige/50">
          <div class="aspect-[3/4] bg-lumia-beige" />
          <div class="space-y-2 p-2 sm:space-y-3 sm:p-4">
            <div class="mx-auto h-3 w-2/3 rounded bg-lumia-beige sm:h-4" />
            <div class="mx-auto h-2.5 w-1/3 rounded bg-lumia-beige/80 sm:h-3" />
          </div>
        </div>
      </div>

      <div
        v-else
        class="mt-6 grid grid-cols-2 gap-x-2 gap-y-4 sm:mt-10 sm:gap-x-6 sm:gap-y-5 lg:mt-12 lg:grid-cols-3 lg:gap-8"
      >
        <ProductCardPremium
          v-for="(p, i) in displayItems"
          :key="p.id"
          :product="p"
          :sales-badge="p.salesBadge ?? null"
          :rating="devRating ? 4 + (i % 2) * 0.5 : null"
          :image-priority="i < 2"
        />
      </div>

      <p v-if="!loading && !displayItems.length" class="mt-8 text-center text-sm text-lumia-ink/50 sm:mt-12">
        Pronto tendremos nuevas piezas en esta vitrina.
      </p>

      <div v-if="!loading && displayItems.length" class="mt-8 sm:hidden">
        <BaseButton to="/products" variant="secondary" block>
          Ver todo el catálogo
        </BaseButton>
      </div>
    </BaseContainer>
  </section>
</template>

<script setup lang="ts">
import type { Product } from '#shared/types/product'

const props = withDefaults(
  defineProps<{
    items?: Product[]
    loading?: boolean
    devRating?: boolean
  }>(),
  {
    items: () => [],
    loading: false,
    devRating: true,
  }
)

/** Normaliza cuando el padre pasa `:items="undefined"` explícitamente (defaults de Vue no aplican). */
const displayItems = computed(() => (Array.isArray(props.items) ? props.items : []))
</script>
