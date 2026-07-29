<template>
  <BaseContainer class="py-16">
    <AppBreadcrumbs
      class="mb-8"
      :items="[
        { label: 'Inicio', to: '/' },
        { label: 'Mi cuenta', to: '/account' },
        { label: 'Favoritos' },
      ]"
    />

    <h1 class="font-display text-3xl text-lumia-ink">Favoritos</h1>
    <p class="mt-2 text-sm text-lumia-ink/55">
      {{ user ? 'Productos guardados en tu cuenta.' : 'Productos guardados en este dispositivo.' }}
    </p>

    <div v-if="pending" class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="n in 3" :key="n" class="aspect-[3/4] animate-pulse rounded-2xl bg-lumia-beige/50" />
    </div>

    <div v-else-if="!favoriteSlugs.length" class="mt-12 rounded-2xl border border-lumia-ink/8 bg-white/70 p-10 text-center">
      <p class="font-display text-lg text-lumia-ink/70">Aún no tienes favoritos.</p>
      <BaseButton to="/products" variant="primary" class="mt-6">Explorar catálogo</BaseButton>
    </div>

    <div v-else-if="products.length" class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <ProductCardPremium v-for="p in products" :key="p.slug" :product="p" />
    </div>

    <div v-else class="mt-12 rounded-2xl border border-lumia-ink/8 bg-white/70 p-10 text-center">
      <p class="text-lumia-ink/60">No encontramos productos activos para tus favoritos.</p>
      <BaseButton to="/products" variant="secondary" class="mt-6">Ver catálogo</BaseButton>
    </div>

    <p v-if="!user" class="mt-8 text-center text-xs text-lumia-ink/45">
      <NuxtLink to="/auth/login" class="font-medium text-lumia-gold underline-offset-2 hover:underline">Inicia sesión</NuxtLink>
      para sincronizar favoritos entre dispositivos.
    </p>
  </BaseContainer>
</template>

<script setup lang="ts">
import type { Product } from '#shared/types/product'

const { user } = useAuth()
const { slugs, load } = useWishlist()

const pending = ref(true)
const products = ref<Product[]>([])

const favoriteSlugs = computed(() => slugs.value)

async function refreshProducts() {
  const list = favoriteSlugs.value
  if (!list.length) {
    products.value = []
    return
  }
  try {
    const res = await $fetch<{ products: Product[] }>('/api/products', {
      query: { slugs: list.join(','), limit: 30 },
    })
    const bySlug = new Map((res.products ?? []).map((p) => [p.slug, p]))
    products.value = list.map((s) => bySlug.get(s)).filter((p): p is Product => Boolean(p))
  } catch {
    products.value = []
  }
}

onMounted(async () => {
  await load()
  await refreshProducts()
  pending.value = false
})

watch(favoriteSlugs, () => {
  if (!pending.value) void refreshProducts()
})

useHead({ title: 'Favoritos — LUMIA' })
</script>
