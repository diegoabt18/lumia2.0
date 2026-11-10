<template>
  <article
    class="catalog-card group relative flex flex-col overflow-hidden rounded-2xl border border-lumia-ink/[0.07] bg-lumia-canvas font-sans shadow-soft transition-[transform,box-shadow] duration-300 md:hover:-translate-y-0.5 md:hover:shadow-soft-lg"
    :class="justAdded ? 'ring-2 ring-lumia-gold/45 ring-offset-2 ring-offset-lumia-canvas' : ''"
  >
    <!-- Imagen protagonista: proporción fija para que todas las tarjetas tengan el mismo tamaño -->
    <div class="relative aspect-[4/5] overflow-hidden bg-lumia-cream/60">
      <div
        v-if="isOutOfStock"
        class="pointer-events-none absolute inset-0 z-[12] bg-gradient-to-t from-lumia-canvas/80 via-lumia-canvas/20 to-transparent"
      />
      <span
        v-if="isOutOfStock"
        class="pointer-events-none absolute left-1/2 top-1/2 z-[13] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-lumia-ink/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-lumia-cream"
      >
        Sin stock
      </span>

      <NuxtLink
        :to="`/products/${product.slug}`"
        class="absolute inset-0 z-0 block"
        :aria-label="`Ver ${product.name}`"
      >
        <ProductShopImage
          :src="imgSrc"
          :alt="product.name"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          :loading="imagePriority ? 'eager' : 'lazy'"
          :fetchpriority="imagePriority ? 'high' : 'auto'"
          sizes="(max-width: 480px) 46vw, (max-width: 640px) 45vw, (max-width: 1024px) 33vw, 280px"
        />
      </NuxtLink>

      <!-- Difuminado de bordes: funde la foto con el fondo de la tarjeta para que no se vea plana -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(246,241,231,0.6)_72%,rgba(246,241,231,0.97)_100%)]"
      />

      <!-- Etiquetas: compactas, arriba a la izquierda, sin tapar la imagen -->
      <div class="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1.5">
        <div
          v-if="promo"
          class="pointer-events-auto relative"
          @mouseenter="startPromoTooltip"
          @mouseleave="cancelPromoTooltip"
        >
          <button
            type="button"
            class="inline-flex h-6 items-center gap-1 rounded-full px-2 text-[10px] font-semibold leading-none shadow-sm transition-transform active:scale-95"
            :style="{ backgroundColor: promoColor, color: promoText, cursor: PROMO_EYE_CURSOR }"
            :aria-expanded="promoOpen ? 'true' : 'false'"
            :aria-describedby="promoTooltipId"
            @click.stop.prevent="togglePromoTooltip"
            @focus="startPromoTooltip"
            @blur="cancelPromoTooltip"
          >
            <IconLoader2 v-if="promoLoading" class="h-3 w-3 animate-spin" stroke-width="2" aria-hidden="true" />
            <IconTag v-else class="h-3 w-3" stroke-width="2" aria-hidden="true" />
            Promoción
          </button>
          <div
            v-if="promoOpen"
            :id="promoTooltipId"
            role="tooltip"
            class="pointer-events-none absolute left-0 top-full z-30 mt-1.5 w-52 rounded-xl bg-lumia-ink p-3 text-left text-lumia-cream shadow-soft-lg"
          >
            <p class="text-[9px] font-semibold uppercase tracking-[0.18em] text-lumia-cream/60">Promoción</p>
            <p class="mt-1 text-[13px] font-semibold leading-snug">{{ promo.name }}</p>
            <p class="mt-1.5 text-[11px] text-lumia-cream/80">
              −{{ promo.percent }}% de descuento<span v-if="promo.endsLabel"> · hasta {{ promo.endsLabel }}</span>
            </p>
          </div>
        </div>

        <span
          v-if="salesTag"
          class="rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-lumia-ink shadow-sm"
        >
          {{ salesTag }}
        </span>
      </div>

      <div class="absolute right-2 top-2 z-20">
        <ProductWishlistButton :product-slug="product.slug" />
      </div>

      <div
        v-if="stockRibbon && !isOutOfStock"
        class="pointer-events-none absolute bottom-2 left-2 z-[14] rounded-full bg-lumia-canvas/90 px-2 py-0.5 text-[10px] font-medium text-lumia-ink/80 shadow-sm"
      >
        {{ stockRibbon }}
      </div>

      <!-- Móvil: botón circular (variantes → ficha; una variante → añadir directo) -->
      <NuxtLink
        v-if="hasMultipleVariants"
        :to="`/products/${product.slug}`"
        class="absolute bottom-2.5 right-2.5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-lumia-ink text-lumia-cream shadow-soft transition active:scale-[0.92] md:hidden"
        :aria-label="`Elegir variante de ${product.name}`"
      >
        <IconChevronRight class="h-4 w-4" stroke-width="1.75" />
      </NuxtLink>
      <button
        v-else
        type="button"
        class="absolute bottom-2.5 right-2.5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-lumia-ink text-lumia-cream shadow-soft transition active:scale-[0.92] disabled:opacity-35 md:hidden"
        :disabled="!firstSku || isOutOfStock || quickAddPending"
        :aria-label="'Añadir ' + product.name + ' al carrito'"
        @click.stop="quickAdd"
      >
        <IconLoader2 v-if="quickAddPending" class="h-4 w-4 animate-spin" stroke-width="1.75" />
        <IconPlus v-else class="h-4 w-4" stroke-width="1.75" />
      </button>

      <!-- Escritorio: aparece al pasar el cursor sobre la imagen -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden translate-y-full p-3 opacity-0 transition-all duration-300 md:pointer-events-auto md:block md:group-hover:translate-y-0 md:group-hover:opacity-100"
      >
        <NuxtLink
          v-if="hasMultipleVariants"
          :to="`/products/${product.slug}`"
          class="pointer-events-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-lumia-ink text-xs font-semibold tracking-wide text-lumia-cream shadow-soft transition hover:bg-lumia-ink/90"
        >
          <IconChevronRight class="h-3.5 w-3.5" stroke-width="2" />
          Elegir variante
        </NuxtLink>
        <button
          v-else
          type="button"
          class="pointer-events-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-lumia-ink text-xs font-semibold tracking-wide text-lumia-cream shadow-soft transition hover:bg-lumia-ink/90 disabled:opacity-40"
          :disabled="!firstSku || isOutOfStock || quickAddPending"
          @click.stop="quickAdd"
        >
          <IconLoader2 v-if="quickAddPending" class="h-3.5 w-3.5 animate-spin" stroke-width="2" />
          <IconPlus v-else class="h-3.5 w-3.5" stroke-width="2" />
          {{ quickAddPending ? 'Agregando…' : 'Añadir rápido' }}
        </button>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2.5 md:px-4 md:pb-4 md:pt-3">
      <NuxtLink :to="`/products/${product.slug}`" class="min-w-0">
        <h3 class="line-clamp-2 text-[16px] font-semibold leading-snug tracking-tight text-lumia-ink transition-colors hover:text-lumia-gold md:text-lg">
          {{ product.name }}
        </h3>
      </NuxtLink>

      <div v-if="showRatings && hasReviews && displayRating != null" class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <div class="flex items-center gap-px" role="img" :aria-label="`Calificación ${displayRating.toFixed(1)} de 5`">
          <template v-for="n in 5" :key="n">
            <IconStarFilled v-if="n <= Math.round(displayRating)" class="h-3 w-3 text-lumia-gold" aria-hidden="true" />
            <IconStar v-else class="h-3 w-3 text-lumia-ink/20" aria-hidden="true" />
          </template>
        </div>
        <span class="text-[11px] font-semibold tabular-nums text-lumia-ink/70">{{ displayRating.toFixed(1) }}</span>
        <span class="text-[11px] tabular-nums text-lumia-ink/50">
          ({{ reviewCount }} {{ reviewCount === 1 ? 'reseña' : 'reseñas' }})
        </span>
      </div>

      <!-- Jerarquía de precio: precio final protagonista, original tachado y descuento como chip -->
      <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span v-if="hasMultipleVariants" class="text-[10px] font-medium uppercase tracking-wider text-lumia-ink/50">Desde</span>
        <span
          class="text-xl font-semibold tabular-nums leading-none md:text-[22px]"
          :class="promoPct != null ? 'text-emerald-700' : 'text-lumia-ink'"
        >
          {{ displayPrice }}
        </span>
        <!-- Chip de descuento con el ojito dentro: revela 2 s la info de la etiqueta; mientras, gira como cuenta regresiva -->
        <span
          v-if="promoPct != null"
          class="inline-flex items-center gap-1 rounded-full py-0.5 pl-2 pr-1 text-[11px] font-bold leading-none tabular-nums shadow-sm"
          :style="{ backgroundColor: promoColor, color: promoText }"
        >
          −{{ promoPct }}%
          <button
            v-if="promo"
            type="button"
            class="inline-flex h-4 w-4 items-center justify-center rounded-full transition hover:bg-black/10 active:scale-90"
            :aria-label="promoPeeking ? 'Mostrando promoción' : 'Ver promoción'"
            @click.stop.prevent="peekPromo"
          >
            <IconLoader2 v-if="promoPeeking" class="h-3 w-3 animate-spin" stroke-width="2.5" aria-hidden="true" />
            <IconEye v-else class="h-3.5 w-3.5" stroke-width="2.25" aria-hidden="true" />
          </button>
        </span>
        <span v-if="compareLine" class="w-full text-sm font-semibold tabular-nums text-rose-600 line-through decoration-2 decoration-rose-600/80">
          {{ compareLine }}
        </span>
      </div>

      <!-- Presentaciones como chips de texto (no como texto plano) -->
      <div v-if="hasMultipleVariants" class="flex flex-wrap items-center gap-1">
        <span
          v-for="chip in variantChips"
          :key="chip"
          class="rounded-full border border-lumia-ink/15 bg-white/60 px-2 py-0.5 text-[10px] font-medium text-lumia-ink/75"
        >
          {{ chip }}
        </span>
        <span v-if="variantMore > 0" class="text-[10px] font-medium text-lumia-ink/50">+{{ variantMore }}</span>
      </div>

    </div>
  </article>
</template>

<script setup lang="ts">
import {
  IconChevronRight,
  IconEye,
  IconLoader2,
  IconPlus,
  IconStar,
  IconStarFilled,
  IconTag,
} from '@tabler/icons-vue'
import type { Product, ProductVariant } from '#shared/types/product'
import { formatVariantLabel } from '#shared/variant-label'
import { normalizePromoColor, promoTextColor } from '~/utils/promo-color'

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
const { formatPrice, formatStoreDate } = useUtils()
const { addItem, isAdding } = useCart()
const { user } = useAuth()
const toast = useToast()
const justAdded = ref(false)
const promoOpen = ref(false)
const promoLoading = ref(false)
const { promotionTooltipDelayMs } = useStoreSettings()
let promoTimer: ReturnType<typeof setTimeout> | null = null

/** Muestra el spinner y, tras el retardo configurado en admin, revela el tooltip de la promoción. */
function startPromoTooltip() {
  if (promoOpen.value || promoTimer) return
  const delay = Math.max(0, promotionTooltipDelayMs.value)
  if (delay === 0) {
    promoOpen.value = true
    return
  }
  promoLoading.value = true
  promoTimer = setTimeout(() => {
    promoTimer = null
    promoLoading.value = false
    promoOpen.value = true
  }, delay)
}

function cancelPromoTooltip() {
  if (promoTimer) clearTimeout(promoTimer)
  promoTimer = null
  if (promoPeekTimer) clearTimeout(promoPeekTimer)
  promoPeekTimer = null
  promoPeeking.value = false
  promoLoading.value = false
  promoOpen.value = false
}

const PROMO_PEEK_MS = 2000
const promoPeeking = ref(false)
let promoPeekTimer: ReturnType<typeof setTimeout> | null = null

/** Ojito: muestra la misma info que la etiqueta durante 2 s; no interfiere si ya está abierta. */
function peekPromo() {
  if (promoOpen.value) return
  promoOpen.value = true
  promoPeeking.value = true
  promoPeekTimer = setTimeout(() => {
    promoPeekTimer = null
    promoPeeking.value = false
    promoOpen.value = false
  }, PROMO_PEEK_MS)
}

/** En táctil el "tap" dispara mouseenter y luego click: no debe cancelar la espera que ya empezó. */
function togglePromoTooltip() {
  if (promoOpen.value) cancelPromoTooltip()
  else if (!promoTimer) startPromoTooltip()
}

onBeforeUnmount(cancelPromoTooltip)

const promoTooltipId = `promo-tip-${props.product.slug}`

/** Cursor con forma de ojo sobre la etiqueta de promoción (el punto de clic queda en el centro). */
const PROMO_EYE_CURSOR = (() => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2B2B2B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/>' +
    '<path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"/>' +
    '</svg>'
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, help`
})()

/** Calificaciones y reseñas solo se muestran a usuarios autenticados. */
const showRatings = computed(() => Boolean(user.value))

const imgSrc = computed(() =>
  resolveProductImageSrc(props.product.slug, props.product.imagePath ?? '', PRODUCT_IMAGE_SIZE_LARGE)
)

function pickDisplayVariant(variants?: ProductVariant[]) {
  if (!variants?.length) return undefined
  return [...variants].sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))[0]
}

const variantCount = computed(() => props.product.variants?.length ?? 0)
const hasMultipleVariants = computed(() => variantCount.value > 1)

/** Primer valor de cada variante (ej. "Mediana") como chip; máximo 3 y el resto como "+N". */
const variantLabels = computed(() => {
  const labels = (props.product.variants ?? [])
    .map((v) => Object.values(v.options ?? {})[0]?.trim() ?? '')
    .filter(Boolean)
  return [...new Set(labels)]
})
const variantChips = computed(() => variantLabels.value.slice(0, 3))
const variantMore = computed(() => Math.max(0, variantCount.value - variantChips.value.length))

const selectedVariant = computed(() => pickDisplayVariant(props.product.variants))
const firstSku = computed(() => selectedVariant.value?.sku ?? '')

const displayRating = computed(() => {
  if (props.rating != null) return props.rating
  const avg = props.product.averageRating
  return avg != null ? Number(avg) : null
})

const reviewCount = computed(() => props.product.reviewsCount ?? null)
/** Sin reseñas no se muestran estrellas vacías. */
const hasReviews = computed(() => (reviewCount.value ?? 0) > 0)

const isNewProduct = computed(() => {
  const raw = props.product.createdAt
  if (!raw) return false
  const t = new Date(raw).getTime()
  return !Number.isNaN(t) && Date.now() - t < 28 * 86400000
})

const salesTag = computed(() => {
  const badge = props.salesBadge ?? props.product.salesBadge
  if (badge === 'bestseller') return 'Top ventas'
  if (badge === 'popular') return 'Tendencia'
  if (isNewProduct.value) return 'Nuevo'
  return ''
})

const promoPct = computed(() => selectedVariant.value?.promotionPercentOff ?? null)

/** Color configurado en la promoción; si no llega (o no es HEX válido) se usa el dorado de Lumia. */
const promoColor = computed(() => normalizePromoColor(selectedVariant.value?.promotionColor))
const promoText = computed(() => promoTextColor(promoColor.value))

const promo = computed(() => {
  const v = selectedVariant.value
  const name = v?.promotionLabel
  if (!name || promoPct.value == null) return null
  const endsLabel = v?.promotionEndsAt ? formatStoreDate(v.promotionEndsAt, 'medium') : ''
  return { name, percent: promoPct.value, endsLabel }
})

const displayPrice = computed(() => {
  const v = selectedVariant.value
  const sale = v?.salePrice ?? v?.price
  if (sale != null) return formatPrice(sale, v?.currency)
  if (props.product.fromPrice != null) return formatPrice(props.product.fromPrice)
  return formatPrice(0)
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

const quickAddPending = computed(() => {
  const sku = firstSku.value
  if (!sku) return false
  return isAdding({ sku })
})

async function quickAdd() {
  // Con varias variantes el usuario debe elegir en la ficha del producto.
  if (hasMultipleVariants.value) return
  const sku = firstSku.value
  const v = selectedVariant.value
  if (!sku || !v || isOutOfStock.value || quickAddPending.value) return
  try {
    const added = await addItem({
      sku,
      quantity: 1,
      product: {
        productSlug: props.product.slug,
        productName: props.product.name,
        variantLabel: formatVariantLabel(v.options, v.sku),
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
  } catch {
    toast.error('No se pudo añadir al carrito')
  }
}
</script>
