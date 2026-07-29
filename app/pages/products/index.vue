<template>
  <BaseContainer class="py-16">
    <div class="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">Catálogo</p>
        <h1 class="mt-3 font-display text-4xl font-medium text-lumia-ink">Todas las velas</h1>
      </div>
      <p v-if="!pending && data" class="text-xs text-lumia-ink/40">
        Fuente: {{ data.source === 'mongodb' ? 'MongoDB Atlas' : 'datos demo' }}
      </p>
    </div>

    <div v-if="pending" class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="n in 6" :key="n" class="animate-pulse overflow-hidden rounded-xl bg-lumia-beige/50">
        <div class="aspect-[3/4] bg-lumia-beige" />
      </div>
    </div>

    <div v-else class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <ProductCardPremium
        v-for="(p, i) in products"
        :key="p.id"
        :product="p"
        :sales-badge="p.salesBadge ?? null"
        :rating="4 + (i % 2) * 0.5"
      />
    </div>
  </BaseContainer>
</template>

<script setup lang="ts">
useHead({ title: 'Catálogo — LUMIA' })

const catalog = useCatalog()

const { data, pending } = await useAsyncData('catalog-products', () =>
  catalog.fetchProducts({ limit: 24, page: 1 })
)

const products = computed(() => data.value?.products ?? [])
</script>
