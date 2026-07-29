<template>
  <aside class="h-fit rounded-2xl border border-lumia-ink/8 bg-lumia-cream/50 p-6 shadow-soft">
    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">Resumen</p>
    <ul class="mt-4 space-y-3">
      <li v-for="item in items" :key="item.sku" class="flex justify-between gap-3 text-sm">
        <span class="min-w-0">
          <span class="block truncate text-lumia-ink/75">{{ item.productName }} × {{ item.quantity }}</span>
          <span v-if="item.variantLabel" class="mt-0.5 block truncate text-xs text-lumia-ink/50">{{ item.variantLabel }}</span>
        </span>
        <span class="shrink-0 tabular-nums text-lumia-ink">{{ formatPrice(item.unitPrice * item.quantity, item.currency) }}</span>
      </li>
    </ul>
    <div class="mt-6 space-y-2 border-t border-lumia-ink/10 pt-4 text-sm">
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
        <span class="font-display text-2xl text-lumia-ink">{{ formatPrice(grandTotal) }}</span>
      </div>
      <p v-if="shippingVariable" class="text-xs text-lumia-ink/45">{{ CART_SHIPPING_ROW_HINT }}</p>
      <p v-else class="text-xs text-lumia-ink/45">Pago acordado con el vendedor tras confirmar el pedido.</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { CartItem } from '#shared/types/product'
import { CART_SHIPPING_ROW_HINT, CART_SHIPPING_ROW_LABEL } from '~/utils/cart-shipping'

const props = defineProps<{
  items: CartItem[]
  count: number
  subtotal: number
  shippingCost: number
  grandTotal: number
  shippingVariable?: boolean
  freeShipping?: boolean
}>()

const { formatPrice } = useUtils()
</script>
