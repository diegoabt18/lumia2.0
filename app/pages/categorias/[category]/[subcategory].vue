<template>
  <div class="w-full bg-lumia-canvas pb-16 pt-4 md:pb-24">
    <div class="border-b border-lumia-ink/8 bg-lumia-cream/40">
      <BaseContainer class="py-4">
        <AppBreadcrumbs :items="breadcrumbs" />
      </BaseContainer>
    </div>

    <BaseContainer class="py-10 md:py-14">
      <header class="max-w-2xl">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">{{ category.name }}</p>
        <h1 class="mt-2 font-display text-3xl font-medium text-lumia-ink md:text-4xl">{{ subcategory?.name }}</h1>
        <p v-if="subcategory?.description" class="mt-3 text-sm leading-relaxed text-lumia-ink/65">
          {{ subcategory.description }}
        </p>
      </header>

      <div
        v-if="productsPending && !products.length"
        class="mt-10 grid grid-cols-2 gap-x-1.5 gap-y-3 sm:gap-x-6 sm:gap-y-5 lg:grid-cols-3 lg:gap-8"
        aria-busy="true"
      >
        <div v-for="n in 6" :key="n" class="aspect-[4/5] animate-pulse rounded-2xl bg-lumia-beige/60" />
      </div>

      <div
        v-else-if="products.length"
        class="mt-10 grid grid-cols-2 gap-x-1.5 gap-y-3 sm:gap-x-6 sm:gap-y-5 lg:grid-cols-3 lg:gap-8"
        :class="productsPending ? 'opacity-70' : ''"
      >
        <ProductCardPremium
          v-for="(p, i) in products"
          :key="p.id"
          :product="p"
          :sales-badge="p.salesBadge ?? null"
          :rating="p.averageRating ?? null"
          :image-priority="i < 6"
        />
      </div>

      <div
        v-else
        class="mt-10 rounded-2xl border border-dashed border-lumia-ink/15 bg-lumia-cream/40 px-8 py-16 text-center"
      >
        <p class="font-display text-xl text-lumia-ink/70">Aún no hay productos en {{ subcategory?.name }}</p>
        <p class="mt-2 text-sm text-lumia-ink/50">Revisa otras subcategorías de {{ category.name }}.</p>
        <NuxtLink
          :to="`/categorias/${encodeURIComponent(category.slug)}`"
          class="mt-6 inline-block text-sm font-semibold text-lumia-gold"
        >
          Volver a {{ category.name }}
        </NuxtLink>
      </div>

      <div v-if="pagination && pagination.total > PAGE_SIZE" class="mt-10 border-t border-lumia-ink/8 pt-8">
        <AppPagination
          :page="page"
          :pages="pagination.totalPages"
          :total="pagination.total"
          :limit="PAGE_SIZE"
          :range-start="rangeStart"
          :range-end="rangeEnd"
          :disabled="productsPending"
          :show-limit-select="false"
          item-label="productos"
          @update:page="goToPage"
        />
      </div>
    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import type { CategoryWithSubcategories, Subcategory } from '#shared/types/category'
import type { Product } from '#shared/types/product'

const PAGE_SIZE = 12

const route = useRoute()
const router = useRouter()
const categorySlug = computed(() => String(route.params.category ?? ''))
const subcategorySlug = computed(() => String(route.params.subcategory ?? ''))
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

// Categoría con sus subcategorías: valida que la subcategoría exista dentro de esa categoría.
const { data: categoryData, error: categoryError } = await useAsyncData(
  () => `storefront-category-${categorySlug.value}`,
  () =>
    $fetch<{ category: CategoryWithSubcategories }>(
      `/api/categories/${encodeURIComponent(categorySlug.value)}`,
    ),
)

const subcategory = computed<Subcategory | null>(() => {
  const cat = categoryData.value?.category
  if (!cat) return null
  return cat.subcategories.find((s) => s.slug === subcategorySlug.value) ?? null
})

if (categoryError.value) {
  const notFound = categoryError.value.statusCode === 404
  throw createError({
    statusCode: notFound ? 404 : 503,
    statusMessage: notFound ? 'Categoría no encontrada' : 'Catálogo no disponible',
    fatal: true,
  })
}
if (!categoryData.value || !subcategory.value) {
  throw createError({ statusCode: 404, statusMessage: 'Subcategoría no encontrada', fatal: true })
}

const category = computed(() => categoryData.value!.category)

interface ProductsPage {
  products: Product[]
  items: Product[]
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

const {
  data: productsData,
  status: productsStatus,
} = await useAsyncData<ProductsPage>(
  () => `storefront-subcategory-products-${categorySlug.value}-${subcategorySlug.value}-${page.value}`,
  () =>
    $fetch<ProductsPage>('/api/products', {
      query: {
        category: categorySlug.value,
        subcategory: subcategorySlug.value,
        page: page.value,
        limit: PAGE_SIZE,
      },
    }),
  { watch: [page] },
)

const productsPending = computed(() => productsStatus.value === 'pending')
const products = computed<Product[]>(() => productsData.value?.products ?? productsData.value?.items ?? [])
const pagination = computed(() => productsData.value?.pagination ?? null)

const rangeStart = computed(() => (pagination.value ? (page.value - 1) * PAGE_SIZE + 1 : 0))
const rangeEnd = computed(() =>
  pagination.value ? Math.min(page.value * PAGE_SIZE, pagination.value.total) : 0,
)

function goToPage(next: number) {
  void router.push({
    query: { ...route.query, page: next > 1 ? String(next) : undefined },
  })
}

const breadcrumbs = computed(() => [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/products' },
  { label: category.value.name, to: `/categorias/${encodeURIComponent(category.value.slug)}` },
  { label: subcategory.value?.name ?? 'Subcategoría' },
])

useHead(() => ({
  title: subcategory.value ? `${subcategory.value.name} · ${category.value.name} — LUMIA` : 'LUMIA',
}))
</script>
