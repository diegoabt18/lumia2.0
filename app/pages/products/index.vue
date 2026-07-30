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
              selectedCategory === cat.slug
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
          v-model:selected-category="selectedCategoryModel"
          v-model:promo-only="promoOnlyModel"
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

          <div v-if="pending && !displayProducts.length" class="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:gap-x-6 sm:gap-y-5 lg:grid-cols-3 lg:gap-8">
            <div v-for="n in 6" :key="n" class="animate-pulse overflow-hidden rounded-xl bg-lumia-beige/50">
              <div class="aspect-[3/4] bg-lumia-beige" />
            </div>
          </div>

          <div
            v-else-if="catalogLoadFailed"
            class="rounded-2xl border border-dashed border-lumia-ink/15 bg-lumia-cream/40 px-8 py-16 text-center"
          >
            <p class="font-display text-xl text-lumia-ink/70">No pudimos cargar el catálogo</p>
            <p class="mt-2 text-sm text-lumia-ink/50">Comprueba tu conexión e inténtalo de nuevo.</p>
            <BaseButton type="button" variant="secondary" class="mt-6" @click="refresh()">Reintentar</BaseButton>
          </div>

          <div
            v-else-if="displayProducts.length"
            class="relative grid grid-cols-2 gap-x-1.5 gap-y-3 sm:gap-x-6 sm:gap-y-5 lg:grid-cols-3 lg:gap-8"
            :class="pending || catalogRetrying ? 'opacity-70' : ''"
          >
            <p
              v-if="catalogRetrying"
              class="col-span-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900"
            >
              No se pudo actualizar el filtro. Mostrando la vista anterior —
              <button type="button" class="font-semibold underline" @click="refresh()">reintentar</button>
            </p>
            <ProductCardPremium
              v-for="(p, i) in displayProducts"
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
              Mostrando productos en oferta según promociones activas.
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
                v-model:selected-category="selectedCategoryModel"
                v-model:promo-only="promoOnlyModel"
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
import { storeToRefs } from 'pinia'
import type { Product } from '#shared/types/product'
import { useCategoryStore } from '~/features/category/stores/category'

const route = useRoute()
const router = useRouter()
const catalog = useCatalog()
const categoryStore = useCategoryStore()
const { categories } = storeToRefs(categoryStore)

const searchInput = ref('')
const filtersDrawerOpen = ref(false)

onMounted(() => {
  if (!categories.value.length) void categoryStore.fetchCategories()
})

const sortOptions = [
  { value: '--', label: 'Destacados' },
  { value: 'price-asc', label: 'Precio ↑' },
  { value: 'price-desc', label: 'Precio ↓' },
  { value: 'name-asc', label: 'Nombre A–Z' },
]

function parseCategoryFromQuery(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return ''
  return raw.split(',')[0]?.trim() ?? ''
}

function parseSortFromQuery(raw: unknown): string {
  if (raw === 'price-asc' || raw === 'price-desc' || raw === 'name-asc') return raw
  return '--'
}

/** Filtros derivados de la URL — una sola fuente de verdad, sin bucles sync. */
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const limit = computed(() => Math.min(48, Math.max(12, Number(route.query.limit) || 12)))
const searchApplied = computed(() => (typeof route.query.search === 'string' ? route.query.search.trim() : ''))
const selectedCategory = computed(() => parseCategoryFromQuery(route.query.category))
const promoOnly = computed(() => route.query.promo === '1')

const sortBy = computed({
  get: () => parseSortFromQuery(route.query.sort),
  set: (value: string) => {
    replaceCatalogQuery({ sort: value !== '--' ? value : undefined, page: undefined })
  },
})

watch(
  () => route.query.search,
  (value) => {
    searchInput.value = typeof value === 'string' ? value : ''
  },
  { immediate: true }
)

type CatalogQueryPatch = Partial<{
  page: string | undefined
  limit: string | undefined
  search: string | undefined
  category: string | undefined
  promo: string | undefined
  sort: string | undefined
}>

function buildQueryFromState(patch: CatalogQueryPatch = {}) {
  const merged: CatalogQueryPatch = {
    page: page.value > 1 ? String(page.value) : undefined,
    limit: limit.value !== 12 ? String(limit.value) : undefined,
    search: searchApplied.value || undefined,
    category: selectedCategory.value || undefined,
    promo: promoOnly.value ? '1' : undefined,
    sort: sortBy.value !== '--' ? sortBy.value : undefined,
    ...patch,
  }

  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(merged)) {
    if (value != null && value !== '') query[key] = value
  }
  return query
}

function replaceCatalogQuery(patch: CatalogQueryPatch) {
  void router.replace({ query: buildQueryFromState(patch) })
}

const selectedCategoryModel = computed({
  get: () => selectedCategory.value,
  set: (slug: string) => replaceCatalogQuery({ category: slug || undefined, page: undefined }),
})

const promoOnlyModel = computed({
  get: () => promoOnly.value,
  set: (value: boolean) => replaceCatalogQuery({ promo: value ? '1' : undefined, page: undefined }),
})

const catalogFetchKey = computed(() => {
  const sortKey = sortBy.value !== '--' ? sortBy.value : 'featured'
  const promoKey = promoOnly.value ? 'promo' : 'all'
  return `${page.value}-${limit.value}-${searchApplied.value}-${selectedCategory.value}-${sortKey}-${promoKey}`
})

type CatalogView = {
  products: Product[]
  source: 'd1' | 'mongo'
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

function emptyCatalogView(): CatalogView {
  return {
    products: [],
    source: 'd1',
    pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
  }
}

/** Categoría y paginación simple → filtro local (sin round-trip al Worker). */
const needsServerCatalog = computed(
  () => promoOnly.value || Boolean(searchApplied.value) || sortBy.value !== '--'
)

const {
  data: catalogSnapshot,
  pending: snapshotPending,
  error: snapshotError,
  refresh: refreshSnapshot,
} = useAsyncData('catalog-snapshot', () => catalog.fetchProducts({ limit: 100, page: 1 }), {
  default: () => emptyCatalogView(),
})

const clientCatalog = computed((): CatalogView | null => {
  if (needsServerCatalog.value) return null
  const all = catalogSnapshot.value?.products ?? []
  if (!all.length) return null

  const list = selectedCategory.value
    ? all.filter((p) => p.categorySlug === selectedCategory.value)
    : all

  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / limit.value))
  const safePage = Math.min(page.value, totalPages)
  const start = (safePage - 1) * limit.value

  return {
    products: list.slice(start, start + limit.value),
    source: catalogSnapshot.value?.source ?? 'd1',
    pagination: { page: safePage, limit: limit.value, total, totalPages },
  }
})

function catalogQuery() {
  const sort = sortBy.value !== '--' ? sortBy.value : undefined
  const promo = promoOnly.value ? '1' : undefined
  return catalog.fetchProducts({
    page: page.value,
    limit: limit.value,
    search: searchApplied.value || undefined,
    category: selectedCategory.value || undefined,
    sort,
    promo,
  })
}

const {
  data: serverCatalog,
  pending: serverPending,
  error: serverError,
  refresh: refreshServer,
} = useAsyncData('catalog-list', () => catalogQuery(), {
  watch: [catalogFetchKey],
  lazy: true,
  immediate: false,
  default: () => emptyCatalogView(),
})

watch(
  needsServerCatalog,
  (need) => {
    if (need) void refreshServer()
  },
  { immediate: true }
)

const activeCatalog = computed(() => {
  if (!needsServerCatalog.value) {
    return clientCatalog.value ?? emptyCatalogView()
  }
  return serverCatalog.value ?? emptyCatalogView()
})

const pending = computed(() => (needsServerCatalog.value ? serverPending.value : snapshotPending.value))
const error = computed(() => (needsServerCatalog.value ? serverError.value : snapshotError.value))

const displayProducts = computed(() => activeCatalog.value.products)
const pagination = computed(() => activeCatalog.value.pagination)

function refresh() {
  if (needsServerCatalog.value) return refreshServer()
  return refreshSnapshot()
}

const catalogLoadFailed = computed(
  () => Boolean(error.value) && !pending.value && !displayProducts.value.length
)
const catalogRetrying = computed(() => Boolean(error.value) && Boolean(displayProducts.value.length))

const rangeStart = computed(() => {
  if (!pagination.value?.total) return 0
  return (page.value - 1) * limit.value + 1
})

const rangeEnd = computed(() => {
  if (!pagination.value?.total) return 0
  return Math.min(page.value * limit.value, pagination.value.total)
})

const hasActiveFilters = computed(
  () => Boolean(selectedCategory.value) || promoOnly.value || Boolean(searchApplied.value)
)

const siteOrigin = useSiteOrigin()

const catalogCanonicalPath = computed(() => {
  const params = new URLSearchParams()
  if (page.value > 1) params.set('page', String(page.value))
  if (searchApplied.value) params.set('search', searchApplied.value)
  if (selectedCategory.value) params.set('category', selectedCategory.value)
  const qs = params.toString()
  return qs ? `/products?${qs}` : '/products'
})

useHead(() => {
  const canonical = `${siteOrigin.value}${catalogCanonicalPath.value}`
  const robots = promoOnly.value ? 'noindex, follow' : undefined

  return {
    title: 'Catálogo — LUMIA',
    meta: [
      {
        name: 'description',
        content: 'Explora velas artesanales LUMIA: aromas, colecciones y promociones.',
      },
      ...(robots ? [{ name: 'robots', content: robots }] : []),
      { property: 'og:title', content: 'Catálogo — LUMIA' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonical },
    ],
    link: [{ rel: 'canonical', href: canonical }],
  }
})

function applySearch() {
  replaceCatalogQuery({ search: searchInput.value.trim() || undefined, page: undefined })
}

function clearFilters() {
  searchInput.value = ''
  void router.replace({ query: {} })
}

function toggleCategoryChip(slug: string) {
  const next = selectedCategory.value === slug ? undefined : slug
  replaceCatalogQuery({ category: next, page: undefined })
}

function goPage(next: number) {
  const max = pagination.value?.totalPages ?? 1
  const clamped = Math.min(Math.max(1, next), max)
  replaceCatalogQuery({ page: clamped > 1 ? String(clamped) : undefined })
  scrollCatalogTop()
}

function onLimitChange(nextLimit: number) {
  replaceCatalogQuery({
    limit: nextLimit !== 12 ? String(nextLimit) : undefined,
    page: undefined,
  })
  scrollCatalogTop()
}

function scrollCatalogTop() {
  if (!import.meta.client) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>
