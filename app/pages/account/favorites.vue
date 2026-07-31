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
const { slugs, loaded } = useWishlist()

const loadingProducts = ref(false)
const products = ref<Product[]>([])
let lastFetchedSlugsKey = ''

const pending = computed(
  () => Boolean(auth.user.value) && (!loaded.value || loadingProducts.value)
)

async function fetchProductsForSlugs(slugList: readonly string[]) {
  const key = slugList.join('\0')
  if (key === lastFetchedSlugsKey) return
  lastFetchedSlugsKey = key

  if (!slugList.length) {
    products.value = []
    return
  }

  loadingProducts.value = true
  try {
    const res = await catalog.fetchProducts({ slugs: slugList.join(','), limit: slugList.length })
    const map = new Map(res.products.map((p) => [p.slug, p]))
    products.value = slugList.map((slug) => map.get(slug)).filter(Boolean) as Product[]
  } catch {
    products.value = []
  } finally {
    loadingProducts.value = false
  }
}

watch(
  () => auth.user.value?.id,
  (userId) => {
    lastFetchedSlugsKey = ''
    products.value = []
    if (!userId) return
    if (loaded.value) void fetchProductsForSlugs(slugs.value)
  },
  { immediate: true },
)

watch(slugs, (slugList) => {
  if (!auth.user.value || !loaded.value) return
  void fetchProductsForSlugs(slugList)
})

watch(loaded, (isLoaded) => {
  if (isLoaded && auth.user.value) void fetchProductsForSlugs(slugs.value)
})

useHead({ title: 'Favoritos — LUMIA' })
</script>
