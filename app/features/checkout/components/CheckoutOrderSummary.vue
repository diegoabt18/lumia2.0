<template>
  <aside class="h-fit lg:sticky lg:top-24">
    <!-- Móvil: resumen colapsable arriba del formulario -->
    <div class="overflow-hidden rounded-2xl border border-lumia-ink/8 bg-lumia-cream/50 shadow-soft lg:hidden">
      <button
        type="button"
        class="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        :aria-expanded="mobileOpen"
        aria-controls="checkout-summary-mobile"
        @click="mobileOpen = !mobileOpen"
      >
        <div class="flex -space-x-2">
          <div
            v-for="item in previewItems"
            :key="item.sku"
            class="relative h-10 w-10 overflow-hidden rounded-lg border-2 border-lumia-cream bg-lumia-beige/40 ring-1 ring-lumia-ink/[0.05]"
          >
            <ProductShopImage
              :src="resolveProductImageSrc(item.productSlug, item.imagePath ?? '')"
              :alt="item.productName"
              class="h-full w-full object-cover"
              sizes="40px"
              loading="lazy"
            />
          </div>
          <span
            v-if="items.length > previewItems.length"
            class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-lumia-cream bg-lumia-ink/8 text-[11px] font-semibold text-lumia-ink/70"
          >
            +{{ items.length - previewItems.length }}
          </span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold uppercase tracking-[0.15em] text-lumia-ink/45">Tu pedido</p>
          <p class="mt-0.5 truncate text-sm font-medium text-lumia-ink">
            {{ count }} {{ count === 1 ? 'artículo' : 'artículos' }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <span class="font-display text-lg font-semibold tabular-nums text-lumia-ink">
            {{ formatPrice(grandTotal) }}
          </span>
          <IconChevronDown
            class="h-5 w-5 text-lumia-ink/40 transition-transform duration-200"
            :class="mobileOpen && 'rotate-180'"
            stroke-width="1.35"
          />
        </div>
      </button>

      <div
        id="checkout-summary-mobile"
        v-show="mobileOpen"
        class="border-t border-lumia-ink/8 px-4 pb-4 pt-3"
      >
      <CheckoutSummaryBody
        :items="items"
        :count="count"
        :subtotal="subtotal"
        :shipping-cost="shippingCost"
        :grand-total="grandTotal"
        :shipping-variable="shippingVariable"
        :free-shipping="freeShipping"
        compact
      />
      </div>
    </div>

    <!-- Desktop -->
    <div class="hidden rounded-2xl border border-lumia-ink/8 bg-lumia-cream/50 p-6 shadow-soft lg:block">
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
import { IconChevronDown } from '@tabler/icons-vue'
import type { CartItem } from '#shared/types/product'

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
const { resolveProductImageSrc } = useProductImages()

const mobileOpen = ref(true)
const previewItems = computed(() => props.items.slice(0, 3))
</script>
