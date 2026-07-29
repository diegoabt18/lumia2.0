<template>
  <div class="w-full bg-lumia-canvas pb-16 pt-4 md:pb-24">
    <div class="border-b border-lumia-ink/8 bg-lumia-cream/40">
      <BaseContainer class="py-4">
        <AppBreadcrumbs :items="[{ label: 'Inicio', to: '/' }, { label: 'Catálogo' }]" />
      </BaseContainer>
    </div>

    <BaseContainer class="pb-28 pt-2 md:py-12 md:pb-24">
      <!-- Barra móvil -->
      <div
        class="sticky top-0 z-30 -mx-4 mb-4 border-b border-lumia-ink/8 bg-lumia-canvas/[0.97] px-4 py-2.5 shadow-[0_10px_40px_-18px_rgba(15,15,15,0.18)] backdrop-blur-lg lg:hidden"
      >
        <div class="flex items-center gap-2">
          <div class="relative min-w-0 flex-1">
            <IconSearch class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lumia-ink/35" stroke-width="1.35" />
            <input
              v-model="searchInput"
              type="search"
              autocomplete="off"
              placeholder="Buscar en LUMIA…"
              class="min-h-[46px] w-full rounded-2xl border border-lumia-ink/10 bg-lumia-cream/45 pl-10 pr-3 text-sm text-lumia-ink placeholder:text-lumia-ink/35 focus:border-lumia-gold/45 focus:outline-none focus:ring-2 focus:ring-lumia-gold/20"
              @keydown.enter.prevent="applySearch"
            />
          </div>
          <button
            type="button"
            class="inline-flex min-h-[46px] min-w-[46px] shrink-0 items-center justify-center rounded-2xl border border-lumia-ink/12 bg-lumia-canvas text-lumia-ink"
            aria-label="Abrir filtros"
            @click="filtersDrawerOpen = true"
          >
            <IconAdjustmentsHorizontal class="h-5 w-5" stroke-width="1.35" />
          </button>
          <select
            v-model="sortBy"
            class="min-h-[46px] max-w-[42%] shrink-0 rounded-2xl border border-lumia-ink/10 bg-lumia-canvas px-2 text-[11px] font-medium text-lumia-ink"
            aria-label="Ordenar catálogo"
          >
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="-mx-1 mt-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            v-for="cat in categories"
            :key="'chip-' + cat.slug"
            type="button"
            class="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold capitalize tracking-wide transition"
            :class="
              selectedCategories.includes(cat.slug)
                ? 'border-lumia-ink bg-lumia-ink text-lumia-cream'
                : 'border-lumia-ink/12 bg-lumia-cream/50 text-lumia-ink/75'
            "
            @click="toggleCategoryChip(cat.slug)"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <ProductFiltersSidebar
          v-model:selected-categories="selectedCategories"
          v-model:promo-only="promoOnly"
          :categories="categories"
          :has-active-filters="hasActiveFilters"
          class="hidden lg:block lg:sticky lg:top-24 lg:w-full lg:max-w-[280px] lg:shrink-0 lg:self-start"
          @clear="clearFilters"
        />

        <div class="min-w-0 flex-1">
          <div class="mb-6 hidden flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:flex">
            <input
              v-model="searchInput"
              type="search"
              autocomplete="off"
              placeholder="Buscar producto…"
              class="min-h-[2.75rem] w-full min-w-0 flex-1 rounded-xl border border-lumia-ink/10 bg-lumia-canvas px-4 text-sm text-lumia-ink placeholder:text-lumia-ink/35 focus:border-lumia-gold/45 focus:outline-none sm:max-w-md"
              @keydown.enter.prevent="applySearch"
            />
            <select
              v-model="sortBy"
              class="min-h-[2.75rem] rounded-xl border border-lumia-ink/10 bg-lumia-canvas px-3 text-sm text-lumia-ink"
            >
              <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <BaseButton type="button" @click="applySearch">Buscar</BaseButton>
            <BaseButton v-if="searchApplied || hasActiveFilters" type="button" variant="ghost" @click="clearFilters">
              Limpiar
            </BaseButton>
          </div>

          <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">Catálogo</p>
              <h1 class="mt-2 font-display text-3xl font-medium text-lumia-ink md:text-4xl">Todas las velas</h1>
            </div>
            <p v-if="!pending && pagination" class="text-xs text-lumia-ink/40">
              {{ rangeStart }}–{{ rangeEnd }} de {{ pagination.total }} productos
            </p>
          </div>

          <div v-if="pending" class="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:gap-x-6 sm:gap-y-5 lg:grid-cols-3 lg:gap-8">
            <div v-for="n in 6" :key="n" class="animate-pulse overflow-hidden rounded-xl bg-lumia-beige/50">
              <div class="aspect-[3/4] bg-lumia-beige" />
            </div>
          </div>

          <div
            v-else-if="filteredProducts.length"
            class="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:gap-x-6 sm:gap-y-5 lg:grid-cols-3 lg:gap-8"
          >
            <ProductCardPremium
              v-for="(p, i) in filteredProducts"
              :key="p.id"
              :product="p"
              :sales-badge="p.salesBadge ?? null"
              :rating="p.averageRating ?? null"
              :image-priority="i < 6"
            />
          </div>

          <div v-else class="rounded-2xl border border-dashed border-lumia-ink/15 bg-lumia-cream/40 px-8 py-16 text-center">
            <p class="font-display text-xl text-lumia-ink/70">No hay productos con estos filtros</p>
            <BaseButton type="button" variant="ghost" class="mt-6" @click="clearFilters">Quitar filtros</BaseButton>
          </div>

          <div v-if="pagination && pagination.total > 0" class="mt-10 border-t border-lumia-ink/8 pt-8">
            <AppPagination
              :page="page"
              :pages="pagination.totalPages"
              :total="pagination.total"
              :limit="limit"
              :range-start="rangeStart"
              :range-end="rangeEnd"
              :disabled="pending"
              :show-limit-select="!promoOnly"
              :limit-options="[12, 24, 48]"
              item-label="productos"
              @update:page="goPage"
              @update:limit="onLimitChange"
            />
            <p v-if="promoOnly" class="mt-3 text-center text-xs text-lumia-ink/45">
              El filtro de ofertas aplica solo a los productos de esta página.
            </p>
          </div>
        </div>
      </div>

      <Teleport to="body">
        <Transition enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
          <div v-if="filtersDrawerOpen" class="fixed inset-0 z-[70] lg:hidden" aria-modal="true" role="dialog">
            <div class="absolute inset-0 bg-lumia-ink/45" @click="filtersDrawerOpen = false" />
            <div class="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border border-lumia-ink/10 bg-lumia-canvas p-4 pb-10" @click.stop>
              <div class="mb-4 flex items-center justify-between">
                <h2 class="font-display text-lg font-medium">Filtros</h2>
                <button type="button" class="text-sm font-semibold text-lumia-gold" @click="filtersDrawerOpen = false">Listo</button>
              </div>
              <ProductFiltersSidebar
                v-model:selected-categories="selectedCategories"
                v-model:promo-only="promoOnly"
                :categories="categories"
                :has-active-filters="hasActiveFilters"
                class="border-0 bg-transparent p-0 shadow-none"
                @clear="clearFilters"
              />
            </div>
          </div>
        </Transition>
      </Teleport>
    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import { IconAdjustmentsHorizontal, IconSearch } from '@tabler/icons-vue'
import type { Product } from '#shared/types/product'

useHead({ title: 'Catálogo — LUMIA' })

const route = useRoute()
const router = useRouter()
const catalog = useCatalog()
const { categories, fetchCategories } = useCategories()

const page = ref(Math.max(1, Number(route.query.page) || 1))
const limit = ref(Math.min(48, Math.max(12, Number(route.query.limit) || 12)))
const searchInput = ref(typeof route.query.search === 'string' ? route.query.search : '')
const searchApplied = ref(searchInput.value.trim())
const sortBy = ref('--')
const promoOnly = ref(false)
const filtersDrawerOpen = ref(false)
const selectedCategories = ref<string[]>([])
let syncingRoute = false

const sortOptions = [
  { value: '--', label: 'Destacados' },
  { value: 'price-asc', label: 'Precio ↑' },
  { value: 'price-desc', label: 'Precio ↓' },
  { value: 'name-asc', label: 'Nombre A–Z' },
]

function syncFromRoute() {
  syncingRoute = true
  const qPage = Math.max(1, Number(route.query.page) || 1)
  const qLimit = Math.min(48, Math.max(12, Number(route.query.limit) || 12))
  if (qPage !== page.value) page.value = qPage
  if (qLimit !== limit.value) limit.value = qLimit

  const cat = route.query.category
  if (typeof cat === 'string' && cat.trim()) {
    selectedCategories.value = cat.split(',').map((s) => s.trim()).filter(Boolean)
  } else if (!cat) {
    selectedCategories.value = []
  }

  const search = typeof route.query.search === 'string' ? route.query.search : ''
  searchInput.value = search
  searchApplied.value = search.trim()
  syncingRoute = false
}

syncFromRoute()

function updateRouteQuery() {
  void router.replace({
    query: {
      page: page.value > 1 ? String(page.value) : undefined,
      limit: limit.value !== 12 ? String(limit.value) : undefined,
      search: searchApplied.value || undefined,
      category: selectedCategories.value.length ? selectedCategories.value.join(',') : undefined,
    },
  })
}

function scrollCatalogTop() {
  if (!import.meta.client) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const categoryKey = computed(() => selectedCategories.value.join(','))

const { data, pending } = await useAsyncData(
  () => `catalog-${page.value}-${limit.value}-${searchApplied.value}-${categoryKey.value}`,
  () =>
    catalog.fetchProducts({
      page: page.value,
      limit: limit.value,
      search: searchApplied.value || undefined,
      category: selectedCategories.value.length ? selectedCategories.value.join(',') : undefined,
    }),
  { watch: [page, limit, searchApplied, categoryKey] }
)

const products = computed(() => data.value?.products ?? [])
const pagination = computed(() => data.value?.pagination)

const rangeStart = computed(() => {
  if (!pagination.value?.total) return 0
  return (page.value - 1) * limit.value + 1
})

const rangeEnd = computed(() => {
  if (!pagination.value?.total) return 0
  return Math.min(page.value * limit.value, pagination.value.total)
})

const hasActiveFilters = computed(
  () => selectedCategories.value.length > 0 || promoOnly.value || Boolean(searchApplied.value)
)

function productHasPromo(p: Product) {
  return p.variants?.some((v) => (v.promotionPercentOff ?? 0) > 0) ?? false
}

function getPriceForSort(p: Product) {
  const prices = p.variants?.map((v) => v.salePrice ?? v.price) ?? []
  if (prices.length) return Math.min(...prices)
  return p.fromPrice ?? 0
}

const filteredProducts = computed(() => {
  let list = [...products.value]
  if (promoOnly.value) list = list.filter(productHasPromo)
  switch (sortBy.value) {
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'price-asc':
      list.sort((a, b) => getPriceForSort(a) - getPriceForSort(b))
      break
    case 'price-desc':
      list.sort((a, b) => getPriceForSort(b) - getPriceForSort(a))
      break
  }
  return list
})

function applySearch() {
  searchApplied.value = searchInput.value.trim()
  page.value = 1
  updateRouteQuery()
}

function clearFilters() {
  searchInput.value = ''
  searchApplied.value = ''
  selectedCategories.value = []
  promoOnly.value = false
  sortBy.value = '--'
  page.value = 1
  limit.value = 12
  void router.replace({ query: {} })
}

function toggleCategoryChip(slug: string) {
  const set = new Set(selectedCategories.value)
  set.has(slug) ? set.delete(slug) : set.add(slug)
  selectedCategories.value = Array.from(set)
  page.value = 1
  updateRouteQuery()
}

function goPage(next: number) {
  const max = pagination.value?.totalPages ?? 1
  page.value = Math.min(Math.max(1, next), max)
  updateRouteQuery()
  scrollCatalogTop()
}

function onLimitChange(nextLimit: number) {
  limit.value = nextLimit
  page.value = 1
  updateRouteQuery()
  scrollCatalogTop()
}

watch(selectedCategories, () => {
  if (syncingRoute) return
  page.value = 1
  updateRouteQuery()
})

watch(
  () => route.query,
  () => syncFromRoute(),
  { deep: true }
)

onMounted(() => {
  void fetchCategories()
})
</script>
