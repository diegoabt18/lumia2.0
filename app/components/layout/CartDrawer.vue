<template>
  <Teleport to="body">
    <Transition name="cart-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[60] flex justify-end bg-lumia-ink/45 backdrop-blur-[10px]"
        @click.self="$emit('update:modelValue', false)"
      >
        <Transition name="cart-slide">
          <aside
            v-if="modelValue"
            class="flex h-[100dvh] w-full max-w-[min(100vw,440px)] flex-col bg-lumia-canvas shadow-[0_25px_80px_-20px_rgba(15,15,15,0.35)]"
            @click.stop
          >
            <header
              class="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-lumia-ink/[0.06] bg-lumia-canvas/88 px-4 py-4 backdrop-blur-xl sm:px-6"
            >
              <div class="min-w-0">
                <p class="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">
                  Mini checkout
                </p>
                <h2 class="mt-1 flex flex-wrap items-baseline gap-2 font-display text-2xl font-semibold text-lumia-ink">
                  Tu carrito
                  <span v-if="countLabel" class="text-lg font-medium text-lumia-ink/45">({{ countLabel }})</span>
                </h2>
              </div>
              <button
                type="button"
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-lumia-ink/[0.07] bg-lumia-cream/40 text-lumia-ink/55 transition hover:border-lumia-gold/35 hover:bg-lumia-beige/45"
                aria-label="Cerrar carrito"
                @click="$emit('update:modelValue', false)"
              >
                <IconX class="h-5 w-5 stroke-[1.25]" />
              </button>
            </header>

            <div v-if="!lineItems.length" class="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <p class="font-display text-xl text-lumia-ink">Tu carrito está vacío</p>
              <p class="mt-2 text-sm text-lumia-ink/55">Explora la colección y añade tus velas favoritas.</p>
              <BaseButton to="/products" variant="secondary" class="mt-8" @click="$emit('update:modelValue', false)">
                Explorar catálogo
              </BaseButton>
            </div>

            <div v-else class="flex min-h-0 flex-1 flex-col">
              <ul class="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
                <li
                  v-for="item in lineItems"
                  :key="item.sku"
                  class="flex gap-3 rounded-xl border border-lumia-ink/[0.06] bg-white p-3"
                >
                  <div class="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-lumia-beige/50">
                    <img
                      :src="resolveProductImageSrc(item.productSlug, item.imagePath ?? '')"
                      :alt="item.productName"
                      class="h-full w-full object-cover"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-lumia-ink">{{ item.productName }}</p>
                    <p class="mt-1 text-sm tabular-nums text-lumia-ink/70">
                      {{ formatPrice(item.unitPrice * item.quantity, item.currency) }}
                    </p>
                    <div class="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        class="flex h-7 w-7 items-center justify-center rounded-full border border-lumia-ink/10 text-sm"
                        @click="updateQty(item.sku, item.quantity - 1)"
                      >
                        −
                      </button>
                      <span class="min-w-[1.5rem] text-center text-sm tabular-nums">{{ item.quantity }}</span>
                      <button
                        type="button"
                        class="flex h-7 w-7 items-center justify-center rounded-full border border-lumia-ink/10 text-sm"
                        @click="updateQty(item.sku, item.quantity + 1)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              </ul>

              <footer
                class="shrink-0 border-t border-lumia-ink/[0.07] bg-lumia-canvas px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6"
              >
                <div class="flex items-center justify-between text-sm">
                  <span class="text-lumia-ink/60">Subtotal</span>
                  <span class="font-display text-lg font-semibold tabular-nums text-lumia-ink">
                    {{ formatPrice(lineTotal) }}
                  </span>
                </div>
                <BaseButton to="/checkout" block class="mt-4" @click="$emit('update:modelValue', false)">
                  Finalizar compra
                </BaseButton>
              </footer>
            </div>
          </aside>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { IconX } from '@tabler/icons-vue'

defineProps<{ modelValue: boolean }>()
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const cart = useCart()
const { formatPrice } = useUtils()
const { resolveProductImageSrc } = useProductImages()

const lineItems = computed(() => cart.items.value)
const lineTotal = computed(() => cart.total.value)
const countLabel = computed(() => {
  const n = cart.count.value
  return n > 0 ? String(n) : ''
})

async function updateQty(sku: string, quantity: number) {
  await cart.updateLineQuantity({ sku }, quantity)
}
</script>

<style scoped>
.cart-fade-enter-active,
.cart-fade-leave-active {
  transition: opacity 0.28s ease;
}
.cart-fade-enter-from,
.cart-fade-leave-to {
  opacity: 0;
}

.cart-slide-enter-active,
.cart-slide-leave-active {
  transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}
.cart-slide-enter-from,
.cart-slide-leave-to {
  transform: translateX(105%);
}
</style>
