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
            type="button"
            class="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wide transition"
            :class="
              favoritesOnly
                ? 'border-lumia-gold bg-lumia-gold/15 text-lumia-ink'
                : 'border-lumia-ink/12 bg-lumia-cream/50 text-lumia-ink/75'
            "
            @click="toggleFavoritesOnly"
          >
            ♥ Favoritos{{ wishlistCount ? ` (${wishlistCount})` : '' }}
          </button>
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
          v-model:selected-category="selectedCategory"
          v-model:promo-only="promoOnly"
          v-model:favorites-only="favoritesOnly"
          :categories="categories"
          :favorites-count="wishlistCount"
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
            :class="pending ? 'opacity-70' : ''"
          >
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
            <p class="font-display text-xl text-lumia-ink/70">
              {{ favoritesOnly && !wishlistCount ? 'Aún no tienes favoritos guardados' : 'No hay productos con estos filtros' }}
            </p>
            <p v-if="favoritesOnly && !wishlistCount" class="mt-2 text-sm text-lumia-ink/50">
              Marca productos con el corazón para verlos aquí.
            </p>
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

          <p v-if="favoritesOnly && wishlistCount && displayProducts.length" class="mt-6 text-center text-xs text-lumia-ink/45">
            Mostrando {{ displayProducts.length }} de {{ wishlistCount }} favoritos.
          </p>
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
                v-model:selected-category="selectedCategory"
                v-model:promo-only="promoOnly"
                v-model:favorites-only="favoritesOnly"
                :categories="categories"
                :favorites-count="wishlistCount"
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
const { slugs: wishlistSlugs, load: loadWishlist } = useWishlist()

const page = ref(Math.max(1, Number(route.query.page) || 1))
const limit = ref(Math.min(48, Math.max(12, Number(route.query.limit) || 12)))
const searchInput = ref(typeof route.query.search === 'string' ? route.query.search : '')
const searchApplied = ref(searchInput.value.trim())
const sortBy = ref(typeof route.query.sort === 'string' && route.query.sort !== '--' ? route.query.sort : '--')
const promoOnly = ref(route.query.promo === '1')
const favoritesOnly = ref(route.query.favorites === '1')
const filtersDrawerOpen = ref(false)
const selectedCategory = ref('')
const debouncedCategory = ref('')
let categoryFetchTimer: ReturnType<typeof setTimeout> | undefined
let syncingRoute = false

onMounted(() => {
  void loadWishlist()
  if (!categories.value.length) void categoryStore.fetchCategories()
})

const wishlistCount = computed(() => wishlistSlugs.value.length)
const wishlistKey = computed(() => [...wishlistSlugs.value].sort().join(','))

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

function buildRouteQuery() {
  return {
    page: page.value > 1 ? String(page.value) : undefined,
    limit: limit.value !== 12 ? String(limit.value) : undefined,
    search: searchApplied.value || undefined,
    category: selectedCategory.value || undefined,
    favorites: favoritesOnly.value ? '1' : undefined,
    promo: promoOnly.value ? '1' : undefined,
    sort: sortBy.value !== '--' ? sortBy.value : undefined,
  }
}

function routeQueryMatchesState() {
  const q = route.query
  const pageOk = (Number(q.page) || 1) === page.value
  const limitOk = (Math.min(48, Math.max(12, Number(q.limit) || 12))) === limit.value
  const searchOk = (typeof q.search === 'string' ? q.search : '') === (searchApplied.value || '')
  const catOk = parseCategoryFromQuery(q.category) === selectedCategory.value
  const favOk = (q.favorites === '1') === favoritesOnly.value
  const promoOk = (q.promo === '1') === promoOnly.value
  const sortRaw = typeof q.sort === 'string' ? q.sort : '--'
  const sortOk = (sortRaw === '--' || !sortRaw ? '--' : sortRaw) === sortBy.value
  return pageOk && limitOk && searchOk && catOk && favOk && promoOk && sortOk
}

function syncFromRoute() {
  syncingRoute = true
  try {
    const qPage = Math.max(1, Number(route.query.page) || 1)
    const qLimit = Math.min(48, Math.max(12, Number(route.query.limit) || 12))
    if (qPage !== page.value) page.value = qPage
    if (qLimit !== limit.value) limit.value = qLimit

    const nextCat = parseCategoryFromQuery(route.query.category)
    if (nextCat !== selectedCategory.value) {
      selectedCategory.value = nextCat
      debouncedCategory.value = nextCat
    }

    const search = typeof route.query.search === 'string' ? route.query.search : ''
    if (searchInput.value !== search) searchInput.value = search
    const nextSearchApplied = search.trim()
    if (searchApplied.value !== nextSearchApplied) searchApplied.value = nextSearchApplied

    const nextFavorites = route.query.favorites === '1'
    if (favoritesOnly.value !== nextFavorites) favoritesOnly.value = nextFavorites

    const nextPromo = route.query.promo === '1'
    if (promoOnly.value !== nextPromo) promoOnly.value = nextPromo

    const sort = typeof route.query.sort === 'string' ? route.query.sort : '--'
    const nextSort = sort === '--' || !sort ? '--' : sort
    if (sortBy.value !== nextSort) sortBy.value = nextSort
  } finally {
    nextTick(() => {
      syncingRoute = false
    })
  }
}

syncFromRoute()
debouncedCategory.value = selectedCategory.value

function scheduleCategoryFetch() {
  if (categoryFetchTimer) clearTimeout(categoryFetchTimer)
  categoryFetchTimer = setTimeout(() => {
    debouncedCategory.value = selectedCategory.value
  }, 280)
}

function updateRouteQuery() {
  if (syncingRoute || routeQueryMatchesState()) return
  void router.replace({ query: buildRouteQuery() })
}

function scrollCatalogTop() {
  if (!import.meta.client) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const categoryKey = computed(() => debouncedCategory.value)
const catalogFetchKey = computed(() => {
  const sortKey = sortBy.value !== '--' ? sortBy.value : 'featured'
  const promoKey = promoOnly.value ? 'promo' : 'all'
  if (favoritesOnly.value) return `fav-${wishlistKey.value}-${sortKey}-${promoKey}`
  return `${page.value}-${limit.value}-${searchApplied.value}-${categoryKey.value}-${sortKey}-${promoKey}`
})

function catalogQuery() {
  const sort = sortBy.value !== '--' ? sortBy.value : undefined
  const promo = promoOnly.value ? '1' : undefined
  if (favoritesOnly.value) {
    const slugs = wishlistSlugs.value
    if (!slugs.length) {
      return Promise.resolve({
        products: [] as Product[],
        source: 'mongodb' as const,
        pagination: { page: 1, limit: 30, total: 0, totalPages: 1 },
      })
    }
    return catalog.fetchProducts({
      slugs: slugs.join(','),
      limit: limit.value,
      page: page.value,
      sort,
      promo,
    })
  }
  return catalog.fetchProducts({
    page: page.value,
    limit: limit.value,
    search: searchApplied.value || undefined,
    category: selectedCategory.value || undefined,
    sort,
    promo,
  })
}

const { data, pending, error, refresh } = useAsyncData(
  () => `catalog-${catalogFetchKey.value}`,
  () => catalogQuery(),
  {
    watch: [catalogFetchKey],
    lazy: true,
    default: () => ({
      products: [] as Product[],
      source: 'mongodb' as const,
      pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
    }),
  }
)

const products = computed(() => data.value?.products ?? [])
const staleProducts = ref<Product[]>([])
watch(products, (list) => {
  if (list.length) staleProducts.value = list
})
const displayProducts = computed(() => {
  if (products.value.length) return products.value
  if (pending.value && staleProducts.value.length) return staleProducts.value
  return products.value
})
const pagination = computed(() => data.value?.pagination)
const catalogLoadFailed = computed(() => Boolean(error.value) && !pending.value && !displayProducts.value.length)

const rangeStart = computed(() => {
  if (!pagination.value?.total) return 0
  return (page.value - 1) * limit.value + 1
})

const rangeEnd = computed(() => {
  if (!pagination.value?.total) return 0
  return Math.min(page.value * limit.value, pagination.value.total)
})

const hasActiveFilters = computed(
  () =>
    Boolean(selectedCategory.value) ||
    promoOnly.value ||
    favoritesOnly.value ||
    Boolean(searchApplied.value)
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
  const robots = favoritesOnly.value || promoOnly.value ? 'noindex, follow' : undefined

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

watch(promoOnly, () => {
  if (syncingRoute) return
  page.value = 1
  updateRouteQuery()
})

watch(sortBy, () => {
  if (syncingRoute) return
  page.value = 1
  updateRouteQuery()
})

function applySearch() {
  searchApplied.value = searchInput.value.trim()
  page.value = 1
  updateRouteQuery()
}

function clearFilters() {
  searchInput.value = ''
  searchApplied.value = ''
  selectedCategory.value = ''
  debouncedCategory.value = ''
  promoOnly.value = false
  favoritesOnly.value = false
  sortBy.value = '--'
  page.value = 1
  limit.value = 12
  void router.replace({ query: {} })
}

function toggleCategoryChip(slug: string) {
  selectedCategory.value = selectedCategory.value === slug ? '' : slug
  page.value = 1
  updateRouteQuery()
  scheduleCategoryFetch()
}

function toggleFavoritesOnly() {
  favoritesOnly.value = !favoritesOnly.value
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

watch(selectedCategory, () => {
  if (syncingRoute) return
  page.value = 1
  updateRouteQuery()
  scheduleCategoryFetch()
})

watch(favoritesOnly, () => {
  if (syncingRoute) return
  page.value = 1
  updateRouteQuery()
})

watch(
  () => route.query,
  () => syncFromRoute(),
  { deep: true }
)
</script>
