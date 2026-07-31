<template>
  <div class="lg:hidden">
    <!-- Barra sticky: productos siempre visibles al hacer scroll -->
    <div
      class="sticky top-16 z-30 -mx-4 border-b border-lumia-ink/8 bg-lumia-canvas/[0.97] px-4 py-2.5 shadow-[0_8px_24px_-12px_rgba(15,15,15,0.12)] backdrop-blur-lg sm:top-[4.5rem]"
    >
      <button
        type="button"
        class="flex w-full items-center gap-3 text-left"
        aria-label="Ver detalle del pedido"
        @click="sheetOpen = true"
      >
        <div
          class="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          @click.stop
        >
          <div
            v-for="item in items"
            :key="item.sku"
            class="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-lumia-beige/40 ring-1 ring-lumia-ink/[0.06]"
          >
            <ProductShopImage
              :src="resolveProductImageSrc(item.productSlug, item.imagePath ?? '')"
              :alt="item.productName"
              class="h-full w-full object-cover"
              sizes="44px"
              loading="lazy"
            />
            <span
              class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-lumia-ink px-0.5 text-[9px] font-semibold text-lumia-cream"
            >
              {{ item.quantity }}
            </span>
          </div>
        </div>
        <div class="shrink-0 text-right">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-lumia-ink/45">
            {{ count }} {{ count === 1 ? 'art.' : 'arts.' }}
          </p>
          <p class="font-display text-base font-semibold tabular-nums text-lumia-ink">
            {{ formatPrice(grandTotal) }}
          </p>
        </div>
        <IconChevronUp class="h-5 w-5 shrink-0 text-lumia-ink/35" stroke-width="1.35" aria-hidden="true" />
      </button>
    </div>

    <!-- Bottom sheet: detalle completo -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200" leave-active-class="transition duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
        <div v-if="sheetOpen" class="fixed inset-0 z-[70] bg-lumia-ink/40 lg:hidden" @click="sheetOpen = false" />
      </Transition>
      <Transition
        enter-active-class="transition duration-250 ease-out"
        leave-active-class="transition duration-200 ease-in"
        enter-from-class="translate-y-full"
        leave-to-class="translate-y-full"
      >
        <aside
          v-if="sheetOpen"
          class="fixed inset-x-0 bottom-0 z-[71] flex max-h-[min(82vh,560px)] flex-col overflow-hidden rounded-t-3xl border border-lumia-ink/10 bg-white pb-[env(safe-area-inset-bottom)] shadow-soft-lg lg:hidden"
          @click.stop
        >
          <div class="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-lumia-ink/15" aria-hidden="true" />
          <div class="flex shrink-0 items-center justify-between border-b border-lumia-ink/8 px-4 py-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.15em] text-lumia-ink/45">Tu pedido</p>
              <p class="mt-0.5 font-display text-lg font-semibold text-lumia-ink">
                {{ count }} {{ count === 1 ? 'artículo' : 'artículos' }}
              </p>
            </div>
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-full text-lumia-ink/50 hover:bg-lumia-ink/5"
              aria-label="Cerrar"
              @click="sheetOpen = false"
            >
              <IconX class="h-5 w-5" stroke-width="1.35" />
            </button>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
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
          <div class="shrink-0 border-t border-lumia-ink/8 px-4 py-3">
            <NuxtLink
              to="/cart"
              class="flex min-h-11 items-center justify-center rounded-xl border border-lumia-ink/12 text-sm font-semibold text-lumia-ink transition hover:bg-lumia-cream/50"
              @click="sheetOpen = false"
            >
              Editar carrito
            </NuxtLink>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { IconChevronUp, IconX } from '@tabler/icons-vue'
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

const { formatPrice } = useUtils()
const { resolveProductImageSrc } = useProductImages()

const sheetOpen = ref(false)

defineExpose({
  openSheet: () => {
    sheetOpen.value = true
  },
})
</script>
