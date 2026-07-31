<template>
  <BaseContainer class="py-16">
    <h1 class="font-display text-3xl text-lumia-ink">Favoritos</h1>
    <p class="mt-2 text-sm text-lumia-ink/55">Productos que guardaste para más tarde.</p>

    <div v-if="!auth.user.value" class="mt-10 rounded-2xl border border-dashed border-lumia-ink/15 p-10 text-center">
      <p class="text-lumia-ink/65">Inicia sesión para sincronizar tus favoritos en todos tus dispositivos.</p>
      <BaseButton to="/auth/login" class="mt-6">Entrar</BaseButton>
    </div>

    <div v-else-if="pending" class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="n in 3" :key="n" class="aspect-[3/4] animate-pulse rounded-2xl bg-lumia-beige/50" />
    </div>

    <div v-else-if="!products.length" class="mt-10 rounded-2xl border border-dashed border-lumia-ink/15 p-10 text-center">
      <p class="text-lumia-ink/65">Aún no tienes favoritos.</p>
      <BaseButton to="/products" class="mt-6">Explorar catálogo</BaseButton>
    </div>

    <div v-else class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ProductCardPremium v-for="product in products" :key="product.slug" :product="product" />
    </div>
  </BaseContainer>
</template>

<script setup lang="ts">
import type { Product } from '#shared/types/product'

const auth = useAuth()
const catalog = useCatalog()
const { slugs, load, loaded } = useWishlist()

const pending = ref(true)
const products = ref<Product[]>([])

async function fetchProducts() {
  await load()
  const list = [...slugs.value]
  if (!list.length) {
    products.value = []
    pending.value = false
    return
  }
  pending.value = true
  try {
    const res = await catalog.fetchProducts({ slugs: list.join(','), limit: list.length })
    const map = new Map(res.products.map((p) => [p.slug, p]))
    products.value = list.map((slug) => map.get(slug)).filter(Boolean) as Product[]
  } catch {
    products.value = []
  } finally {
    pending.value = false
  }
}

watch(
  () => auth.user.value?.id,
  () => {
    if (auth.loaded.value) void fetchProducts()
  },
  { immediate: true }
)

watch(slugs, () => {
  if (loaded.value) void fetchProducts()
})

useHead({ title: 'Favoritos — LUMIA' })
</script>
