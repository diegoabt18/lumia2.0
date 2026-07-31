<template>
  <div class="space-y-2 text-sm" :class="$attrs.class">
    <div class="flex items-center justify-between text-lumia-ink/65">
      <span>Subtotal productos</span>
      <span class="tabular-nums">{{ formatPrice(lineTotal, currency) }}</span>
    </div>
    <div class="flex items-start justify-between gap-3 text-lumia-ink/65">
      <span>Envío</span>
      <span class="text-right">
        <span class="font-medium" :class="shippingQuote.variable ? 'text-amber-800' : 'text-lumia-ink'">{{ shippingRowLabel }}</span>
        <span v-if="shippingQuote.variable" class="mt-0.5 block text-[11px] text-lumia-ink/45">{{ CART_SHIPPING_ROW_HINT }}</span>
      </span>
    </div>
    <div class="flex items-center justify-between border-t border-lumia-ink/8 pt-3">
      <span class="font-medium text-lumia-ink">Total estimado</span>
      <span class="font-display text-lg font-semibold tabular-nums text-lumia-ink lg:text-xl">
        {{ formatPrice(shippingQuote.grandTotal, currency) }}
      </span>
    </div>
    <p class="text-[11px] leading-relaxed text-lumia-ink/45">
      {{ shippingQuote.variable ? 'Sin incluir envío. El total final puede variar.' : 'Incluye envío según tarifa configurada.' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { CART_SHIPPING_ROW_HINT } from '~/utils/cart-shipping'

defineProps<{
  lineTotal: number
  shippingQuote: { variable: boolean; grandTotal: number }
  currency: string
  shippingRowLabel: string
}>()

defineOptions({ inheritAttrs: false })

const { formatPrice } = useUtils()
</script>
