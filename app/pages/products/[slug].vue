<template>
  <div v-if="product">
    <PdpImageLightbox v-model="lightboxOpen" :slides="gallerySlides" :start-index="lightboxStartIndex" />

    <div class="bg-lumia-canvas pb-28 pt-4 lg:pb-16 md:pb-24">
      <div class="border-b border-lumia-ink/8 bg-lumia-cream/40">
        <BaseContainer class="py-4">
          <AppBreadcrumbs
            :items="[
              { label: 'Inicio', to: '/' },
              { label: 'Catálogo', to: '/products' },
              { label: product.name },
            ]"
          />
        </BaseContainer>
      </div>

      <BaseContainer class="py-10 md:py-14">
        <div class="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div class="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <PdpProductGallery
              :slides="gallerySlides"
              :product-name="product.name"
              :probing="galleryProbing"
              @open-lightbox="openLightbox"
            />
          </div>

          <div class="flex flex-col duration-500">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">LUMIA</p>
              <div class="mt-3 flex items-start justify-between gap-4">
                <h1 class="font-display text-4xl font-medium leading-tight text-lumia-ink md:text-5xl">
                  {{ product.name }}
                </h1>
                <ProductWishlistButton :product-slug="product.slug" class="shrink-0" />
              </div>
            </div>

            <div class="mt-5">
              <PdpBadgesRow :sales-badge="product.salesBadge ?? null" />
              <a
                v-if="product.averageRating != null && product.reviewsCount"
                href="#opiniones"
                class="mt-4 inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-full border border-lumia-ink/8 bg-white/70 px-4 py-2.5 shadow-soft transition hover:border-lumia-gold/35 hover:bg-white"
              >
                <span class="flex items-center gap-0.5 text-lumia-gold" aria-hidden="true">
                  <span v-for="n in 5" :key="n" class="text-base leading-none">{{ ratingStarChar(n) }}</span>
                </span>
                <span class="font-display text-base font-semibold tabular-nums text-lumia-ink md:text-lg">
                  {{ product.averageRating.toFixed(1) }}
                </span>
                <span class="hidden h-4 w-px bg-lumia-ink/15 sm:block" aria-hidden="true" />
                <span class="text-sm font-medium text-lumia-ink/55">{{ reviewsCountLabel }}</span>
              </a>
            </div>

            <div v-if="selectedVariant" class="mt-6 space-y-4">
              <div class="flex flex-wrap items-baseline gap-4">
                <span class="font-display text-3xl text-lumia-ink">{{ formatPrice(displaySalePrice, selectedVariant.currency) }}</span>
                <span
                  v-if="priceWasHigher"
                  class="font-display text-xl text-lumia-ink/35 line-through"
                >{{ formatPrice(displayOriginalPrice, selectedVariant.currency) }}</span>
                <span
                  v-if="selectedVariant.promotionPercentOff"
                  class="rounded-full bg-lumia-gold/25 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lumia-ink"
                >
                  −{{ selectedVariant.promotionPercentOff }}%
                </span>
              </div>
              <PdpStockBanner :stock="variantStockStatus === 'made_to_order' ? 999 : (selectedVariant?.stock ?? null)" />
              <div v-if="variantStockStatus === 'made_to_order'" class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <span class="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Fabricación bajo pedido
                </span>
              </div>
              <p
                v-if="variantStockStatus === 'made_to_order'"
                class="text-xs leading-relaxed text-lumia-ink/55"
              >
                Este producto se prepara especialmente para tu pedido. Los tiempos de entrega pueden ser mayores.
              </p>
            </div>
            <p v-else-if="product.fromPrice != null" class="mt-6 font-display text-3xl text-lumia-ink">
              Desde {{ formatPrice(product.fromPrice) }}
            </p>

            <p v-if="product.description" class="mt-8 text-base leading-relaxed text-lumia-ink/75">
              {{ product.description }}
            </p>

            <div v-if="product.variants?.length" class="mt-10 space-y-3">
              <label class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45" for="pdp-variant">
                Variante
              </label>
              <select
                id="pdp-variant"
                v-model="selectedSku"
                class="w-full rounded-xl border border-lumia-ink/12 bg-lumia-canvas px-4 py-3 text-sm text-lumia-ink focus:border-lumia-gold/45 focus:outline-none"
              >
                <option v-for="v in product.variants" :key="v.sku" :value="v.sku">
                  {{ variantSelectLabel(v) }}
                </option>
              </select>
            </div>

            <div v-if="visibleOptionAxes.length" class="mt-6 space-y-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">
                Opciones de {{ selectedVariant?.sku ?? 'variante' }}
              </p>
              <div v-for="axis in visibleOptionAxes" :key="axis.id" class="space-y-2">
                <label class="text-xs font-medium text-lumia-ink/55">{{ axis.name }}</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="val in axis.values"
                    :key="val.id"
                    type="button"
                    class="min-h-11 min-w-[48px] rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150"
                    :class="
                      pdpByAxis[axis.id] === val.id
                        ? 'border-lumia-ink bg-lumia-ink text-white shadow-sm'
                        : 'border-lumia-ink/15 bg-white text-lumia-ink/70 hover:border-lumia-ink/30 hover:text-lumia-ink'
                    "
                    :aria-pressed="pdpByAxis[axis.id] === val.id"
                    @click="selectOptionValue(axis.id, val.id)"
                  >
                    {{ val.value }}
                  </button>
                </div>
              </div>
            </div>

            <div
              v-if="product.optionsFormat === 'legacy' && legacyOptionEntries.length"
              class="mt-10 space-y-3"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">Opciones</p>
              <dl class="space-y-2 text-sm text-lumia-ink/80">
                <div v-for="row in legacyOptionEntries" :key="row[0]" class="flex flex-wrap gap-2">
                  <dt class="text-lumia-ink/50">{{ row[0] }}</dt>
                  <dd class="font-medium text-lumia-ink">{{ row[1] }}</dd>
                </div>
              </dl>
            </div>

            <div class="mt-10 flex flex-wrap items-center gap-4">
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">Cantidad</span>
              <PdpQuantityStepper v-model="quantity" :max="maxQty" :disabled="!selectedVariant || maxQty < 1" />
            </div>

            <div class="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <BaseButton
                type="button"
                variant="primary"
                class="min-h-[48px] sm:min-w-[200px]"
                :disabled="!selectedVariant || addToCartPending || variantStockStatus === 'out_of_stock'"
                @click="addToCart"
              >
                <span v-if="addToCartPending">Agregando...</span>
                <span v-else-if="variantStockStatus === 'made_to_order'">Agregar bajo pedido</span>
                <span v-else-if="variantStockStatus === 'out_of_stock'">Sin stock</span>
                <span v-else>Añadir al carrito</span>
              </BaseButton>
              <BaseButton
                type="button"
                variant="secondary"
                class="min-h-[48px] sm:min-w-[200px]"
                :disabled="!selectedVariant || buyNowPending || variantStockStatus === 'out_of_stock'"
                :aria-busy="buyNowPending"
                @click="buyNow"
              >
                <span v-if="buyNowPending">Redirigiendo...</span>
                <span v-else>Comprar ahora</span>
              </BaseButton>
              <BaseButton to="/products" variant="ghost">Seguir comprando</BaseButton>
            </div>
          </div>
        </div>

        <LazyProductReviewsSection
          v-if="product"
          :slug="product.slug"
          :initial-average="product.averageRating ?? null"
          :initial-count="product.reviewsCount ?? null"
        />

        <section v-if="related.length" class="mt-20">
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">También te puede gustar</p>
          <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ProductCardPremium v-for="p in related" :key="p.slug" :product="p" />
          </div>
        </section>
      </BaseContainer>
    </div>

    <PdpStickyMobileBar
      :visible="stickyVisible"
      :thumb-src="stickyThumbSrc"
      :title="product.name"
      :price-label="stickyPriceLabel"
      :variant-label="stickyVariantLabel"
      :add-disabled="!selectedVariant || variantStockStatus === 'out_of_stock'"
      :add-pending="addToCartPending"
      :buy-pending="buyNowPending"
      :add-label="variantStockStatus === 'made_to_order' ? 'Agregar bajo pedido' : undefined"
      @add-cart="addToCart"
      @buy-now="buyNow"
    />
  </div>

  <div v-else-if="productPending" class="bg-lumia-canvas px-4 py-20">
    <BaseContainer>
      <div class="grid gap-12 lg:grid-cols-2">
        <div class="aspect-[3/4] animate-pulse rounded-2xl bg-lumia-beige/60" />
        <div class="space-y-4">
          <div class="h-8 w-2/3 animate-pulse rounded bg-lumia-beige/60" />
          <div class="h-24 animate-pulse rounded bg-lumia-beige/40" />
          <div class="h-12 animate-pulse rounded bg-lumia-beige/50" />
        </div>
      </div>
    </BaseContainer>
  </div>

  <div v-else class="flex min-h-[50vh] items-center justify-center bg-lumia-canvas px-4">
    <div class="text-center">
      <p class="font-display text-lg text-lumia-ink/70">No encontramos este producto.</p>
      <p v-if="productError" class="mt-2 text-sm text-lumia-ink/45">
        {{ productErrorMessage }}
      </p>
      <NuxtLink to="/products" class="mt-4 inline-block text-sm font-medium text-lumia-gold underline-offset-4 hover:underline">
        Volver al catálogo
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductOptionAxisDTO, ProductVariant } from '#shared/types/product'
import { formatVariantLabel } from '#shared/variant-label'
import { useMediaQuery, useWindowScroll } from '@vueuse/core'

const route = useRoute()
const slugParam = computed(() => String(route.params.slug ?? ''))

const { data: detailData, pending: productPending, error: productError } = useAsyncData(
  () => `product-detail-${slugParam.value}`,
  async () => {
    const { fetchProductBySlug } = useCatalog()
    const { product } = await fetchProductBySlug(slugParam.value)
    return { product }
  },
  { watch: [slugParam], default: () => ({ product: null as Product | null }) }
)

const { fetchProducts } = useCatalog()

const { data: relatedData } = useAsyncData(
  () => `pdp-related-${slugParam.value}`,
  () => fetchProducts({ limit: 4, page: 1 }),
  { lazy: true, default: () => ({ products: [] as Product[], pagination: { page: 1, limit: 4, total: 0, totalPages: 1 } }) }
)

const product = computed(() => detailData.value?.product ?? null)

const productErrorMessage = computed(() => {
  const e = productError.value as { data?: { message?: string }; message?: string; statusCode?: number } | null
  if (!e) return ''
  if (e.statusCode === 503) {
    return 'La API no respondió. Verifica que el servidor esté activo y NUXT_API_BASE_URL sea correcta.'
  }
  return e.data?.message ?? e.message ?? 'Error al cargar el producto.'
})

const { addItem, isAdding } = useCart()
const { formatPrice } = useUtils()
const { resolveProductImageSrc } = useProductImages()
const toast = useToast()

const buyNowPending = ref(false)

const selectedSku = ref('')

const selectedVariant = computed<ProductVariant | null>(() => {
  const list = product.value?.variants ?? []
  if (!list.length) return null
  const sku = selectedSku.value || list[0]?.sku
  return list.find((v) => v.sku === sku) ?? list[0] ?? null
})

const displaySalePrice = computed(() => selectedVariant.value?.salePrice ?? selectedVariant.value?.price ?? 0)
const displayOriginalPrice = computed(() => selectedVariant.value?.compareAtPrice ?? selectedVariant.value?.price ?? 0)
const priceWasHigher = computed(
  () => displayOriginalPrice.value > displaySalePrice.value && displaySalePrice.value > 0
)

const reviewsCountLabel = computed(() => {
  const n = product.value?.reviewsCount ?? 0
  if (n === 1) return '1 reseña'
  return `${n} reseñas`
})

function ratingStarChar(n: number) {
  const avg = product.value?.averageRating ?? 0
  return n <= Math.round(avg) ? '★' : '☆'
}

const maxQty = computed(() => {
  const s = selectedVariant.value?.stock ?? selectedVariant.value?.available
  if (s == null) return 99
  return Math.min(Math.max(s, 0), 99)
})

const variantStockStatus = computed<'in_stock' | 'made_to_order' | 'out_of_stock'>(() => {
  const v = selectedVariant.value
  if (!v) return 'out_of_stock'
  if (v.isMadeToOrder) return 'made_to_order'
  const stock = v.stock ?? v.available
  if (stock == null) return 'in_stock'
  if (stock > 0) return 'in_stock'
  return 'out_of_stock'
})

const visibleOptionAxes = computed<ProductOptionAxisDTO[]>(() => {
  const p = product.value
  const v = selectedVariant.value
  if (!p?.optionAxes?.length || !v?.optionRules?.length) return []
  const ruleMap = new Map(v.optionRules.map((r) => [r.optionId, new Set(r.allowedValueIds)]))
  return p.optionAxes
    .filter((axis) => ruleMap.has(axis.id))
    .map((axis) => ({
      ...axis,
      values: axis.values.filter((val) => ruleMap.get(axis.id)?.has(val.id)),
    }))
    .filter((axis) => axis.values.length > 0)
})

const pdpByAxis = reactive<Record<string, string>>({})

function selectOptionValue(axisId: string, valueId: string) {
  if (pdpByAxis[axisId] === valueId) return
  const currentVariant = selectedVariant.value
  if (currentVariant?.optionRules) {
    const rule = currentVariant.optionRules.find((r) => r.optionId === axisId)
    if (rule?.allowedValueIds.includes(valueId)) {
      pdpByAxis[axisId] = valueId
      return
    }
  }
  const variants = product.value?.variants ?? []
  const selectedOthers = Object.entries(pdpByAxis).filter(([k, v]) => k !== axisId && Boolean(v))
  for (const v of variants) {
    if (v.sku === currentVariant?.sku) continue
    if (!v.optionRules?.length) continue
    const ruleMap = new Map(v.optionRules.map((r) => [r.optionId, new Set(r.allowedValueIds)]))
    if (!ruleMap.get(axisId)?.has(valueId)) continue
    const othersMatch = selectedOthers.every(([aId, vId]) => ruleMap.get(aId)?.has(vId))
    if (othersMatch) {
      pdpByAxis[axisId] = valueId
      selectedSku.value = v.sku
      return
    }
  }
  const candidates = variants.filter((v) => {
    if (v.sku === currentVariant?.sku) return false
    return v.optionRules?.some((r) => r.optionId === axisId && r.allowedValueIds.includes(valueId))
  })
  if (candidates.length) {
    pdpByAxis[axisId] = valueId
    for (const ax of visibleOptionAxes.value) {
      if (ax.id !== axisId) pdpByAxis[ax.id] = ax.values[0]?.id ?? ''
    }
    selectedSku.value = candidates[0]!.sku
  }
}

const legacyOptionEntries = computed(() => {
  const v = selectedVariant.value
  if (!v?.options || !Object.keys(v.options).length) return [] as [string, string][]
  return Object.entries(v.options) as [string, string][]
})

watch(
  () => selectedVariant.value?.sku,
  () => {
    const axes = visibleOptionAxes.value
    for (const axis of axes) {
      const first = axis.values[0]
      if (first && !pdpByAxis[axis.id]) pdpByAxis[axis.id] = first.id
    }
  },
  { immediate: true }
)

const quantity = ref(1)
const lightboxOpen = ref(false)
const lightboxStartIndex = ref(0)

onBeforeRouteLeave(() => {
  lightboxOpen.value = false
})

const isMobileLayout = useMediaQuery('(max-width: 1023px)')
const { y: scrollY } = useWindowScroll()

const catalogImagePath = computed(() => selectedVariant.value?.imagePath ?? product.value?.imagePath ?? '')
const { slides: gallerySlides, probing: galleryProbing } = usePdpGallerySlides(slugParam, catalogImagePath)

const stickyVisible = computed(() => Boolean(product.value && isMobileLayout.value && scrollY.value > 200))
const stickyThumbSrc = computed(() => gallerySlides.value[0]?.thumb ?? editorialFallbackSrc.value)
const editorialFallbackSrc = computed(() =>
  product.value?.slug ? resolveProductImageSrc(product.value.slug, catalogImagePath.value, 'medium') : ''
)

const stickyPriceLabel = computed(() => {
  if (!selectedVariant.value) return '—'
  return formatPrice(displaySalePrice.value, selectedVariant.value.currency)
})

const stickyVariantLabel = computed(() => {
  if (!selectedVariant.value) return ''
  return variantSelectLabel(selectedVariant.value)
})

const related = computed(() => {
  const slug = slugParam.value
  return (relatedData.value?.products ?? []).filter((p) => p.slug !== slug).slice(0, 4)
})

watch(
  () => selectedVariant.value?.sku,
  () => {
    quantity.value = 1
  }
)

watch(maxQty, (m) => {
  if (quantity.value > m) quantity.value = Math.max(1, m)
})

watch(
  () => product.value?.variants,
  (variants) => {
    if (!variants?.length) {
      selectedSku.value = ''
      return
    }
    if (!selectedSku.value || !variants.some((x) => x.sku === selectedSku.value)) {
      selectedSku.value = variants[0]?.sku ?? ''
    }
  },
  { immediate: true }
)

function variantSelectLabel(v: ProductVariant) {
  const unit = v.salePrice ?? v.price
  const price = formatPrice(unit, v.currency)
  return `${v.sku} — ${price}`
}

function openLightbox(i: number) {
  lightboxStartIndex.value = i
  lightboxOpen.value = true
}

async function addToCart() {
  if (!selectedVariant.value || !product.value) return
  const payload = {
    sku: selectedVariant.value.sku,
    quantity: quantity.value,
    product: {
      productSlug: product.value.slug,
      productName: product.value.name,
      variantLabel: formatVariantLabel(selectedVariant.value.options, selectedVariant.value.sku),
      unitPrice: displaySalePrice.value,
      currency: selectedVariant.value.currency ?? 'COP',
      imagePath: catalogImagePath.value,
    },
  }
  try {
    await addItem(payload)
  } catch {
    toast.error('Error agregando producto al carrito')
  }
}

async function buyNow() {
  if (!selectedVariant.value || !product.value) return
  buyNowPending.value = true
  try {
    const payload = {
      sku: selectedVariant.value.sku,
      quantity: quantity.value,
      product: {
        productSlug: product.value.slug,
        productName: product.value.name,
        variantLabel: formatVariantLabel(selectedVariant.value.options, selectedVariant.value.sku),
        unitPrice: displaySalePrice.value,
        currency: selectedVariant.value.currency ?? 'COP',
        imagePath: catalogImagePath.value,
      },
    }
    const added = await addItem(payload)
    if (added) await navigateTo('/checkout')
  } catch {
    toast.error('No se pudo continuar al checkout')
  } finally {
    buyNowPending.value = false
  }
}

const addToCartPending = computed(() => {
  if (!selectedVariant.value) return false
  return isAdding({ sku: selectedVariant.value.sku })
})

const siteOrigin = useSiteOrigin()

useHead(() => {
  const p = product.value
  if (!p) return { title: 'Producto — LUMIA' }
  const origin = siteOrigin.value
  const desc = (p.description ?? '').slice(0, 160)
  const img = editorialFallbackSrc.value
  const canonical = `${origin}/products/${encodeURIComponent(p.slug)}`
  const variant = selectedVariant.value
  const inStock = (variant?.available != null ? variant.available : variant?.stock ?? 0) > 0

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description ?? undefined,
    image: img || undefined,
    sku: variant?.sku,
    brand: { '@type': 'Brand', name: 'LUMIA' },
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: variant?.currency ?? 'COP',
      price: String(displaySalePrice.value ?? 0),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  if (p.averageRating != null && p.reviewsCount) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(p.averageRating),
      reviewCount: String(p.reviewsCount),
    }
  }

  return {
    title: `${p.name} · LUMIA`,
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: p.name },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'product' },
      { property: 'og:url', content: canonical },
      ...(img ? [{ property: 'og:image', content: img }] : []),
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    link: [{ rel: 'canonical', href: canonical }],
    script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd) }],
  }
})
</script>
