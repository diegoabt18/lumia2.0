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
              <h1 class="mt-3 font-display text-4xl font-medium leading-tight text-lumia-ink md:text-5xl">
                {{ product.name }}
              </h1>
            </div>

            <div class="mt-5">
              <PdpBadgesRow :sales-badge="product.salesBadge ?? null" />
            </div>

            <div v-if="selectedVariant" class="mt-6 space-y-4">
              <div class="flex flex-wrap items-baseline gap-4">
                <span class="font-display text-3xl text-lumia-ink">{{ formatPrice(displaySalePrice, selectedVariant.currency) }}</span>
                <span
                  v-if="priceWasHigher"
                  class="font-display text-xl text-lumia-ink/35 line-through"
                >{{ formatPrice(displayOriginalPrice, selectedVariant.currency) }}</span>
              </div>
              <PdpStockBanner :stock="variantStockStatus === 'made_to_order' ? 999 : (selectedVariant?.stock ?? null)" />
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
                <span v-else-if="variantStockStatus === 'out_of_stock'">Sin stock</span>
                <span v-else>Añadir al carrito</span>
              </BaseButton>
              <BaseButton to="/products" variant="ghost">Seguir comprando</BaseButton>
            </div>
          </div>
        </div>

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
      @add-cart="addToCart"
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
      <NuxtLink to="/products" class="mt-4 inline-block text-sm font-medium text-lumia-gold underline-offset-4 hover:underline">
        Volver al catálogo
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductVariant } from '#shared/types/product'
import { useMediaQuery, useWindowScroll } from '@vueuse/core'

const route = useRoute()
const slugParam = computed(() => String(route.params.slug ?? ''))

const { data: detailData, pending: productPending } = await useAsyncData(
  () => `product-detail-${slugParam.value}`,
  () => $fetch<{ product: Product | null }>(`/api/products/${encodeURIComponent(slugParam.value)}`),
  { watch: [slugParam] }
)

const { fetchProducts } = useCatalog()

const { data: relatedData } = await useAsyncData(
  () => `pdp-related-${slugParam.value}`,
  () => fetchProducts({ limit: 12 })
)

const product = computed(() => detailData.value?.product ?? null)

const { addItem, isAdding } = useCart()
const { formatPrice } = useUtils()
const { resolveProductImageSrc } = useProductImages()
const toast = useToast()

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

const maxQty = computed(() => {
  const s = selectedVariant.value?.stock ?? selectedVariant.value?.available
  if (s == null) return 99
  return Math.min(Math.max(s, 0), 99)
})

const variantStockStatus = computed<'in_stock' | 'made_to_order' | 'out_of_stock'>(() => {
  const v = selectedVariant.value
  if (!v) return 'out_of_stock'
  const stock = v.stock ?? v.available ?? 0
  if (stock > 0) return 'in_stock'
  return 'out_of_stock'
})

const quantity = ref(1)
const lightboxOpen = ref(false)
const lightboxStartIndex = ref(0)

const isMobileLayout = useMediaQuery('(max-width: 1023px)')
const { y: scrollY } = useWindowScroll()

const catalogImagePath = computed(() => selectedVariant.value?.imagePath ?? product.value?.imagePath ?? '')
const slugRef = computed(() => product.value?.slug ?? '')
const { slides: gallerySlides, probing: galleryProbing } = usePdpGallerySlides(slugRef, catalogImagePath)

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
  const opts = Object.values(v.options ?? {}).join(' · ')
  return opts ? `${opts} — ${price}` : `${v.sku} — ${price}`
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
      unitPrice: displaySalePrice.value,
      currency: selectedVariant.value.currency ?? 'COP',
      imagePath: catalogImagePath.value,
    },
  }
  try {
    const added = await addItem(payload)
    if (added) toast.success(`"${product.value.name}" agregado al carrito`)
  } catch {
    toast.error('Error agregando producto al carrito')
  }
}

const addToCartPending = computed(() => {
  if (!selectedVariant.value) return false
  return isAdding({ sku: selectedVariant.value.sku })
})

useHead(() => {
  const p = product.value
  if (!p) return { title: 'Producto — LUMIA' }
  const desc = (p.description ?? '').slice(0, 160)
  const img = editorialFallbackSrc.value
  return {
    title: `${p.name} · LUMIA`,
    meta: [{ name: 'description', content: desc }, ...(img ? [{ property: 'og:image', content: img }] : [])],
  }
})
</script>
