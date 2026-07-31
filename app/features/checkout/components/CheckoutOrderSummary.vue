<template>
  <aside class="hidden h-fit lg:block lg:sticky lg:top-24">
    <div class="rounded-2xl border border-lumia-ink/8 bg-lumia-cream/50 p-6 shadow-soft">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">Resumen</p>
      <div class="mt-4">
        <CheckoutSummaryBody
          :items="items"
          :count="count"
          :subtotal="subtotal"
          :shipping-cost="shippingCost"
          :grand-total="grandTotal"
          :shipping-variable="shippingVariable"
          :free-shipping="freeShipping"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { CartItem } from '#shared/types/product'

defineProps<{
  items: CartItem[]
  count: number
  subtotal: number
  shippingCost: number
  grandTotal: number
  shippingVariable?: boolean
  freeShipping?: boolean
}>()
</script>
