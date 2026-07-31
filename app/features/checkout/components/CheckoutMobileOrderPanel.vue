<template>
  <div class="lg:hidden">
    <!-- Barra sticky: 2 filas en pantallas estrechas (≤360px) -->
    <div
      class="sticky top-16 z-30 -mx-3 border-b border-lumia-ink/8 bg-lumia-canvas/[0.97] px-3 py-2 shadow-[0_8px_24px_-12px_rgba(15,15,15,0.12)] backdrop-blur-lg sm:-mx-4 sm:top-[4.5rem] sm:px-4 sm:py-2.5"
    >
      <button
        type="button"
        class="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 text-left sm:gap-x-3"
        aria-label="Ver detalle del pedido"
        @click="sheetOpen = true"
      >
        <div
          class="col-span-2 flex min-w-0 gap-1.5 overflow-x-auto [scrollbar-width:none] sm:col-span-1 sm:gap-2 [&::-webkit-scrollbar]:hidden"
          @click.stop
        >
          <div
            v-for="item in items"
            :key="item.sku"
            class="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-lumia-beige/40 ring-1 ring-lumia-ink/[0.06] sm:h-10 sm:w-10 sm:rounded-lg"
          >
            <ProductShopImage
              :src="resolveProductImageSrc(item.productSlug, item.imagePath ?? '')"
              :alt="item.productName"
              class="h-full w-full object-cover"
              sizes="40px"
              loading="lazy"
            />
            <span
              class="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-lumia-ink px-0.5 text-[8px] font-semibold text-lumia-cream sm:h-4 sm:min-w-[1rem] sm:text-[9px]"
            >
              {{ item.quantity }}
            </span>
          </div>
        </div>

        <div class="min-w-0 text-left">
          <p class="truncate text-[9px] font-semibold uppercase tracking-wide text-lumia-ink/45 sm:text-[10px]">
            {{ count }} {{ count === 1 ? 'art.' : 'arts.' }}
          </p>
          <p class="truncate font-display text-sm font-semibold tabular-nums text-lumia-ink sm:text-base">
            {{ formatPrice(grandTotal) }}
          </p>
        </div>

        <IconChevronUp class="h-4 w-4 shrink-0 text-lumia-ink/35 sm:h-5 sm:w-5" stroke-width="1.35" aria-hidden="true" />
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
          class="fixed inset-x-0 bottom-0 z-[71] flex max-h-[min(82vh,560px)] flex-col overflow-hidden rounded-t-2xl border border-lumia-ink/10 bg-white pb-[env(safe-area-inset-bottom)] shadow-soft-lg sm:rounded-t-3xl lg:hidden"
          @click.stop
        >
          <div class="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-lumia-ink/15 sm:mt-3" aria-hidden="true" />
          <div class="flex shrink-0 items-center justify-between gap-2 border-b border-lumia-ink/8 px-3 py-2.5 sm:px-4 sm:py-3">
            <div class="min-w-0">
              <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-lumia-ink/45 sm:text-xs">Tu pedido</p>
              <p class="truncate font-display text-base font-semibold text-lumia-ink sm:text-lg">
                {{ count }} {{ count === 1 ? 'artículo' : 'artículos' }}
              </p>
            </div>
            <button
              type="button"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lumia-ink/50 hover:bg-lumia-ink/5 sm:h-11 sm:w-11"
              aria-label="Cerrar"
              @click="sheetOpen = false"
            >
              <IconX class="h-5 w-5" stroke-width="1.35" />
            </button>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
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
          <div class="shrink-0 border-t border-lumia-ink/8 px-3 py-2.5 sm:px-4 sm:py-3">
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
