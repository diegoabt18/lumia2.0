<template>
  <article
    class="catalog-card group relative flex flex-col overflow-hidden rounded-xl border border-lumia-ink/[0.06] bg-lumia-canvas shadow-soft transition-[transform,box-shadow] duration-300 md:rounded-2xl md:hover:shadow-soft-lg"
    :class="justAdded ? 'ring-2 ring-lumia-gold/45 ring-offset-2 ring-offset-lumia-canvas' : ''"
  >
    <div class="relative aspect-[3/4] overflow-hidden">
      <div
        v-if="isOutOfStock"
        class="pointer-events-none absolute inset-0 z-[12] bg-gradient-to-t from-lumia-canvas/75 via-lumia-canvas/25 to-transparent"
      />
      <div
        v-if="isOutOfStock"
        class="pointer-events-none absolute left-1/2 top-1/2 z-[13] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-lumia-ink/88 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-lumia-cream shadow-soft backdrop-blur-sm"
      >
        Sin stock
      </div>

      <div
        v-if="stockRibbon && !isOutOfStock"
        class="pointer-events-none absolute bottom-2 left-2 z-[14] rounded-full border border-white/40 bg-lumia-canvas/88 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-lumia-ink/85 shadow-sm backdrop-blur-md"
      >
        {{ stockRibbon }}
      </div>

      <NuxtLink
        :to="`/products/${product.slug}`"
        class="absolute inset-0 z-0 block"
        :aria-label="`Ver ${product.name}`"
      >
        <ProductShopImage
          :src="imgSrc"
          :alt="product.name"
          class="h-full w-full group-hover:scale-[1.03] motion-reduce:transition-none"
          :loading="imagePriority ? 'eager' : 'lazy'"
          :fetchpriority="imagePriority ? 'high' : 'auto'"
          sizes="(max-width: 480px) 46vw, (max-width: 640px) 45vw, (max-width: 1024px) 33vw, 280px"
        />
      </NuxtLink>

      <div class="pointer-events-none absolute left-1.5 top-1.5 z-10 flex max-w-[calc(100%-3rem)] flex-wrap gap-1 md:left-2 md:top-2">
        <span
          v-for="tag in badgeStack"
          :key="tag.key"
          class="rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur-md md:text-[9px]"
          :class="tag.class"
        >
          {{ tag.label }}
        </span>
      </div>

      <button
        type="button"
        class="absolute bottom-2 right-2 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-lumia-ink text-lumia-cream shadow-[0_10px_28px_-8px_rgba(15,15,15,0.45)] transition active:scale-[0.92] disabled:opacity-35 md:hidden"
        :disabled="!firstSku || isOutOfStock"
        :aria-label="'Añadir ' + product.name + ' al carrito'"
        @click.stop="quickAdd"
      >
        <IconPlus class="h-[18px] w-[18px]" stroke-width="1.35" />
      </button>

      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden translate-y-full bg-gradient-to-t from-lumia-ink/55 via-lumia-ink/15 to-transparent p-3 pt-12 opacity-0 transition-all duration-300 md:pointer-events-auto md:block md:group-hover:translate-y-0 md:group-hover:opacity-100"
      >
        <button
          type="button"
          class="pointer-events-auto inline-flex w-full min-h-[44px] items-center justify-center rounded-xl border border-white/25 bg-lumia-canvas px-4 text-xs font-semibold uppercase tracking-wide text-lumia-ink shadow-soft transition hover:bg-lumia-beige/90 disabled:opacity-40"
          :disabled="!firstSku || isOutOfStock"
          @click.stop="quickAdd"
        >
          <IconPlus class="h-4 w-4" stroke-width="1.35" />
          Añadir rápido
        </button>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 flex-col px-2 pb-2 pt-1.5 md:px-4 md:pb-5 md:pt-4 md:text-center">
      <NuxtLink :to="`/products/${product.slug}`" class="min-w-0">
        <h3 class="line-clamp-2 font-display text-[13px] font-medium leading-[1.25] text-lumia-ink transition-colors hover:text-lumia-gold md:text-lg">
          {{ product.name }}
        </h3>
      </NuxtLink>

      <div v-if="displayRating != null" class="mt-1 flex flex-wrap items-center gap-x-1.5 md:justify-center">
        <div class="flex items-center gap-0.5 text-lumia-gold" aria-hidden="true">
          <span v-for="n in 5" :key="n" class="text-[10px] leading-none md:text-[11px]">{{ starChar(n) }}</span>
        </div>
        <span v-if="reviewCount != null" class="text-[10px] tabular-nums text-lumia-ink/42">({{ reviewCount }})</span>
      </div>

      <div class="mt-2 md:mt-3">
        <div class="flex flex-wrap items-end gap-x-2 gap-y-0.5 md:justify-center">
          <span class="font-display text-xl font-bold tabular-nums leading-none text-lumia-ink md:text-2xl">
            {{ displayPrice }}
          </span>
          <span
            v-if="promoPct != null"
            class="mb-0.5 rounded-md bg-lumia-gold/22 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-lumia-ink"
          >
            −{{ promoPct }}%
          </span>
        </div>
        <p v-if="compareLine" class="mt-0.5 text-[11px] tabular-nums text-lumia-ink/38 line-through md:text-xs">
          {{ compareLine }}
        </p>
      </div>

      <p
        v-if="promotionCampaignLabel"
        class="mt-1 line-clamp-1 text-[9px] font-medium text-lumia-gold/90 md:text-[10px] md:text-center"
      >
        {{ promotionCampaignLabel }}
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { IconPlus } from '@tabler/icons-vue'
import type { Product, ProductVariant } from '#shared/types/product'

const props = withDefaults(
  defineProps<{
    product: Product
    salesBadge?: 'bestseller' | 'popular' | null
    rating?: number | null
    imagePriority?: boolean
  }>(),
  {
    salesBadge: null,
    rating: null,
    imagePriority: false,
  }
)

const { resolveProductImageSrc, PRODUCT_IMAGE_SIZE_LARGE } = useProductImages()
const { formatPrice } = useUtils()
const cart = useCart()
const justAdded = ref(false)

const imgSrc = computed(() =>
  resolveProductImageSrc(props.product.slug, props.product.imagePath ?? '', PRODUCT_IMAGE_SIZE_LARGE)
)

function pickDisplayVariant(variants?: ProductVariant[]) {
  if (!variants?.length) return undefined
  return [...variants].sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))[0]
}

const selectedVariant = computed(() => pickDisplayVariant(props.product.variants))
const firstSku = computed(() => selectedVariant.value?.sku ?? '')

const displayRating = computed(() => {
  if (props.rating != null) return props.rating
  const avg = props.product.averageRating
  return avg != null ? Number(avg) : null
})

const reviewCount = computed(() => props.product.reviewsCount ?? null)

function starChar(n: number) {
  const r = displayRating.value
  if (r == null) return '☆'
  return n <= Math.round(r) ? '★' : '☆'
}

const isNewProduct = computed(() => {
  const raw = props.product.createdAt
  if (!raw) return false
  const t = new Date(raw).getTime()
  return !Number.isNaN(t) && Date.now() - t < 28 * 86400000
})

const badgeStack = computed(() => {
  type Tone = 'dark' | 'gold' | 'muted'
  const rows: { key: string; label: string; tone: Tone }[] = []
  const badge = props.salesBadge ?? props.product.salesBadge
  if (badge === 'bestseller') rows.push({ key: 'bs', label: 'Top ventas', tone: 'dark' })
  if (badge === 'popular') rows.push({ key: 'pop', label: 'Tendencia', tone: 'gold' })
  if (isNewProduct.value) rows.push({ key: 'new', label: 'Nuevo', tone: 'gold' })
  const pct = selectedVariant.value?.promotionPercentOff
  if (pct != null) rows.push({ key: 'pct', label: `−${pct}%`, tone: 'dark' })

  const toneClass: Record<Tone, string> = {
    dark: 'bg-lumia-ink/82 text-lumia-cream ring-1 ring-white/15',
    gold: 'bg-lumia-gold/85 text-lumia-ink ring-1 ring-white/25',
    muted: 'bg-white/72 text-lumia-ink/90 ring-1 ring-lumia-ink/[0.07]',
  }
  return rows.slice(0, 3).map((r) => ({ key: r.key, label: r.label, class: toneClass[r.tone] }))
})

const displayPrice = computed(() => {
  const v = selectedVariant.value
  const sale = v?.salePrice ?? v?.price
  if (sale != null) return formatPrice(sale, v?.currency)
  if (props.product.fromPrice != null) return formatPrice(props.product.fromPrice)
  return formatPrice(0)
})

const promoPct = computed(() => selectedVariant.value?.promotionPercentOff ?? null)
const promotionCampaignLabel = computed(() => {
  const label = selectedVariant.value?.promotionLabel
  return label && promoPct.value != null ? label : ''
})

const compareLine = computed(() => {
  const v = selectedVariant.value
  if (!v) return ''
  const orig = v.compareAtPrice ?? v.originalPrice ?? v.price
  const sale = v.salePrice ?? v.price
  return orig > sale ? formatPrice(orig, v.currency) : ''
})

const isOutOfStock = computed(() => {
  const list = props.product.variants
  if (!list?.length) return false
  const counts = list.map((v) => v.available ?? v.quantity).filter((x): x is number => x != null)
  if (!counts.length) return false
  return !counts.some((n) => n > 0)
})

const stockRibbon = computed(() => {
  const s = selectedVariant.value?.available ?? selectedVariant.value?.quantity
  if (s == null || s <= 0) return ''
  if (s <= 3) return `Solo ${s} uds.`
  if (s <= 8) return 'Stock limitado'
  return ''
})

async function quickAdd() {
  const sku = firstSku.value
  const v = selectedVariant.value
  if (!sku || !v || isOutOfStock.value) return
  const added = await cart.addItem({
    sku,
    quantity: 1,
    product: {
      productSlug: props.product.slug,
      productName: props.product.name,
      unitPrice: v.salePrice ?? v.price,
      currency: v.currency ?? 'COP',
      imagePath: props.product.imagePath,
    },
  })
  if (added) {
    justAdded.value = true
    setTimeout(() => {
      justAdded.value = false
    }, 650)
  }
}
</script>
