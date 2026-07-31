<template>
  <ul class="space-y-3" :class="compact ? 'max-h-[min(40vh,280px)] overflow-y-auto pr-1' : ''">
    <li v-for="item in items" :key="item.sku" class="flex items-start gap-3">
      <div
        class="relative shrink-0 overflow-hidden rounded-lg bg-lumia-beige/40 ring-1 ring-lumia-ink/[0.05]"
        :class="compact ? 'h-12 w-12' : 'h-14 w-14'"
      >
        <ProductShopImage
          :src="resolveProductImageSrc(item.productSlug, item.imagePath ?? '')"
          :alt="item.productName"
          class="h-full w-full object-cover"
          :sizes="compact ? '48px' : '56px'"
          loading="lazy"
        />
        <span
          class="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-lumia-ink px-1 text-[10px] font-semibold text-lumia-cream"
        >
          {{ item.quantity }}
        </span>
      </div>
      <div class="min-w-0 flex-1">
        <p class="line-clamp-2 text-sm font-medium leading-snug text-lumia-ink">{{ item.productName }}</p>
        <p v-if="item.variantLabel" class="mt-0.5 line-clamp-1 text-xs text-lumia-ink/50">{{ item.variantLabel }}</p>
        <p class="mt-1 text-xs tabular-nums text-lumia-ink/55">
          {{ formatPrice(item.unitPrice, item.currency) }} × {{ item.quantity }}
        </p>
      </div>
      <span class="shrink-0 pt-0.5 text-sm font-medium tabular-nums text-lumia-ink">
        {{ formatPrice(item.unitPrice * item.quantity, item.currency) }}
      </span>
    </li>
  </ul>

  <div class="mt-4 space-y-2 border-t border-lumia-ink/10 pt-4 text-sm">
    <div class="flex items-center justify-between text-lumia-ink/65">
      <span>Subtotal</span>
      <span class="tabular-nums">{{ formatPrice(subtotal) }}</span>
    </div>
    <div class="flex items-start justify-between gap-3 text-lumia-ink/65">
      <span>Envío</span>
      <span class="text-right tabular-nums">
        <template v-if="shippingVariable">{{ CART_SHIPPING_ROW_LABEL }}</template>
        <template v-else-if="freeShipping">Gratis</template>
        <template v-else>{{ formatPrice(shippingCost) }}</template>
      </span>
    </div>
    <div class="flex items-baseline justify-between border-t border-lumia-ink/10 pt-3">
      <span class="text-sm text-lumia-ink/55">{{ count }} {{ count === 1 ? 'artículo' : 'artículos' }}</span>
      <span class="font-display text-xl text-lumia-ink lg:text-2xl">{{ formatPrice(grandTotal) }}</span>
    </div>
    <p v-if="shippingVariable" class="text-xs text-lumia-ink/45">{{ CART_SHIPPING_ROW_HINT }}</p>
    <p v-else class="text-xs text-lumia-ink/45">Pago acordado con el vendedor tras confirmar el pedido.</p>
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
