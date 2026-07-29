<template>
  <aside class="h-fit rounded-2xl border border-lumia-ink/8 bg-lumia-cream/50 p-6 shadow-soft">
    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">Resumen</p>
    <ul class="mt-4 space-y-3">
      <li v-for="item in items" :key="item.sku" class="flex justify-between gap-3 text-sm">
        <span class="min-w-0 truncate text-lumia-ink/75">{{ item.productName }} × {{ item.quantity }}</span>
        <span class="shrink-0 tabular-nums text-lumia-ink">{{ formatPrice(item.unitPrice * item.quantity, item.currency) }}</span>
      </li>
    </ul>
    <div class="mt-6 border-t border-lumia-ink/10 pt-4">
      <div class="flex items-baseline justify-between">
        <span class="text-sm text-lumia-ink/55">{{ count }} {{ count === 1 ? 'artículo' : 'artículos' }}</span>
        <span class="font-display text-2xl text-lumia-ink">{{ formatPrice(total) }}</span>
      </div>
      <p class="mt-2 text-xs text-lumia-ink/45">Pago acordado con el vendedor tras confirmar el pedido.</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { CartItem } from '#shared/types/product'

defineProps<{
  items: CartItem[]
  count: number
  total: number
}>()

const { formatPrice } = useUtils()
</script>
