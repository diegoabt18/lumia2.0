<template>
  <div>
    <ul class="space-y-3" :class="compact ? 'pr-0.5' : ''">
      <li v-for="item in items" :key="item.sku" class="flex items-start gap-2.5 sm:gap-3">
        <NuxtLink
          :to="`/products/${item.productSlug}`"
          class="relative shrink-0 overflow-hidden rounded-lg bg-lumia-beige/40 ring-1 ring-lumia-ink/[0.05]"
          :class="compact ? 'h-11 w-11 sm:h-12 sm:w-12' : 'h-14 w-14'"
        >
          <ProductShopImage
            :src="resolveProductImageSrc(item.productSlug, item.imagePath ?? '')"
            :alt="item.productName"
            class="h-full w-full object-cover"
            :sizes="compact ? '44px' : '56px'"
            loading="lazy"
          />
          <span
            class="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-lumia-ink px-0.5 text-[9px] font-semibold text-lumia-cream sm:h-5 sm:min-w-[1.25rem] sm:px-1 sm:text-[10px]"
          >
            {{ item.quantity }}
          </span>
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <NuxtLink
            :to="`/products/${item.productSlug}`"
            class="line-clamp-2 text-[13px] font-medium leading-snug text-lumia-ink hover:text-lumia-gold sm:text-sm"
          >
            {{ item.productName }}
          </NuxtLink>
          <p v-if="item.variantLabel" class="mt-0.5 line-clamp-1 text-[11px] text-lumia-ink/50 sm:text-xs">
            {{ item.variantLabel }}
          </p>
          <p class="mt-1 text-[11px] tabular-nums text-lumia-ink/55 sm:text-xs">
            {{ formatPrice(item.unitPrice, item.currency) }} × {{ item.quantity }}
          </p>
          <p v-if="compact" class="mt-1 text-[13px] font-medium tabular-nums text-lumia-ink">
            {{ formatPrice(item.unitPrice * item.quantity, item.currency) }}
          </p>
        </div>
        <span v-if="!compact" class="hidden shrink-0 pt-0.5 text-sm font-medium tabular-nums text-lumia-ink sm:block">
          {{ formatPrice(item.unitPrice * item.quantity, item.currency) }}
        </span>
      </li>
    </ul>

    <div class="mt-4 space-y-2 border-t border-lumia-ink/10 pt-3 text-[13px] sm:pt-4 sm:text-sm">
      <div class="flex items-center justify-between gap-2 text-lumia-ink/65">
        <span class="shrink-0">Subtotal</span>
        <span class="truncate text-right tabular-nums">{{ formatPrice(subtotal) }}</span>
      </div>
      <div class="flex items-start justify-between gap-2 text-lumia-ink/65">
        <span class="shrink-0">Envío</span>
        <span class="min-w-0 text-right text-[12px] tabular-nums sm:text-sm">
          <template v-if="shippingVariable">{{ CART_SHIPPING_ROW_LABEL }}</template>
          <template v-else-if="freeShipping">Gratis</template>
          <template v-else>{{ formatPrice(shippingCost) }}</template>
        </span>
      </div>
      <div class="flex items-baseline justify-between gap-2 border-t border-lumia-ink/10 pt-3">
        <span class="shrink-0 text-xs text-lumia-ink/55 sm:text-sm">{{ count }} {{ count === 1 ? 'art.' : 'arts.' }}</span>
        <span class="truncate font-display text-lg text-lumia-ink sm:text-xl lg:text-2xl">{{ formatPrice(grandTotal) }}</span>
      </div>
      <p v-if="shippingVariable" class="text-[11px] leading-relaxed text-lumia-ink/45 sm:text-xs">{{ CART_SHIPPING_ROW_HINT }}</p>
      <p v-else class="text-[11px] leading-relaxed text-lumia-ink/45 sm:text-xs">Pago acordado con el vendedor tras confirmar el pedido.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CartItem } from '#shared/types/product'
import { CART_SHIPPING_ROW_HINT, CART_SHIPPING_ROW_LABEL } from '~/utils/cart-shipping'

defineProps<{
  items: CartItem[]
  count: number
  subtotal: number
  shippingCost: number
  grandTotal: number
  shippingVariable?: boolean
  freeShipping?: boolean
  compact?: boolean
}>()

const { formatPrice } = useUtils()
const { resolveProductImageSrc } = useProductImages()
</script>
