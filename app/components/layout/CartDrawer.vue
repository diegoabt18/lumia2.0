<template>
  <Teleport v-if="canTeleport" to="body">
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
              class="relative shrink-0 border-b border-lumia-ink/[0.06] bg-gradient-to-b from-lumia-cream/50 to-lumia-canvas px-4 pb-4 pt-5 backdrop-blur-xl sm:px-6"
            >
              <div class="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-lumia-gold/60 to-transparent" />
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-lumia-gold/80">
                    Mini checkout
                  </p>
                  <h2 class="mt-1 flex flex-wrap items-baseline gap-2 font-display text-2xl font-semibold text-lumia-ink">
                    Tu carrito
                    <span v-if="countLabel" class="text-lg font-medium text-lumia-ink/45">({{ countLabel }})</span>
                  </h2>
                  <p v-if="lineItems.length" class="mt-1 text-xs text-lumia-ink/50">
                    {{ lineItems.length }} {{ lineItems.length === 1 ? 'producto' : 'productos' }} · Pago acordado con el vendedor
                  </p>
                </div>
                <button
                  type="button"
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-lumia-ink/[0.07] bg-white/70 text-lumia-ink/55 transition hover:border-lumia-gold/35 hover:bg-lumia-beige/45 hover:text-lumia-ink active:scale-[0.96]"
                  aria-label="Cerrar carrito"
                  @click="$emit('update:modelValue', false)"
                >
                  <IconX class="h-5 w-5 stroke-[1.25]" />
                </button>
              </div>
            </header>

            <div v-if="!lineItems.length" class="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-full bg-lumia-cream/80 text-2xl ring-1 ring-lumia-gold/20">
                🕯️
              </div>
              <p class="mt-6 font-display text-xl text-lumia-ink">Tu carrito está vacío</p>
              <p class="mt-2 max-w-xs text-sm leading-relaxed text-lumia-ink/55">
                Explora la colección y añade tus velas favoritas.
              </p>
              <BaseButton to="/products" variant="secondary" class="mt-8" @click="$emit('update:modelValue', false)">
                Explorar catálogo
              </BaseButton>
            </div>

            <div v-else class="flex min-h-0 flex-1 flex-col">
              <div class="cart-drawer-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
                <TransitionGroup name="cart-line" tag="ul" class="space-y-3">
                  <li
                    v-for="item in lineItems"
                    :key="item.sku"
                    class="group relative overflow-hidden rounded-2xl border border-lumia-ink/[0.06] bg-white shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]"
                  >
                    <div class="flex gap-3 p-3 sm:gap-4 sm:p-3.5">
                      <NuxtLink
                        :to="`/products/${item.productSlug}`"
                        class="relative h-[92px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-lumia-beige/40 ring-1 ring-lumia-ink/[0.05]"
                        @click="$emit('update:modelValue', false)"
                      >
                        <ProductShopImage
                          :src="resolveProductImageSrc(item.productSlug, item.imagePath ?? '')"
                          :alt="item.productName"
                          class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          sizes="72px"
                          loading="lazy"
                        />
                      </NuxtLink>

                      <div class="flex min-w-0 flex-1 flex-col">
                        <div class="flex items-start justify-between gap-2">
                          <div class="min-w-0">
                            <NuxtLink
                              :to="`/products/${item.productSlug}`"
                              class="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-lumia-ink transition hover:text-lumia-gold"
                              @click="$emit('update:modelValue', false)"
                            >
                              {{ item.productName }}
                            </NuxtLink>
                            <p v-if="item.variantLabel" class="mt-1 line-clamp-2 text-[12px] font-medium text-lumia-ink/55">
                              {{ item.variantLabel }}
                            </p>
                          </div>
                          <button
                            type="button"
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lumia-ink/35 transition hover:bg-lumia-ink/[0.05] hover:text-rose-600 active:scale-[0.94]"
                            aria-label="Quitar producto"
                            @click="removeLine(item.sku)"
                          >
                            <IconTrash class="h-4 w-4 stroke-[1.35]" />
                          </button>
                        </div>

                        <div class="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                          <div class="flex items-center gap-0.5 rounded-full border border-lumia-ink/[0.08] bg-lumia-cream/40 p-0.5">
                            <button
                              type="button"
                              class="flex h-9 w-9 items-center justify-center rounded-full text-lumia-ink/70 transition hover:bg-white active:scale-[0.94] disabled:opacity-35"
                              aria-label="Reducir cantidad"
                              :disabled="item.quantity <= 1 || isQtyUpdating(item.sku)"
                              @click="updateQty(item.sku, item.quantity - 1)"
                            >
                              <IconMinus class="h-4 w-4 stroke-[1.35]" />
                            </button>
                            <span class="relative min-w-[2rem] text-center font-display text-[15px] font-semibold tabular-nums text-lumia-ink">
                              <IconLoader2
                                v-if="isQtyUpdating(item.sku)"
                                class="mx-auto h-4 w-4 animate-spin text-lumia-ink/45"
                                stroke-width="1.35"
                              />
                              <span v-else>{{ item.quantity }}</span>
                            </span>
                            <button
                              type="button"
                              class="flex h-9 w-9 items-center justify-center rounded-full text-lumia-ink/70 transition hover:bg-white active:scale-[0.94] disabled:opacity-35"
                              aria-label="Aumentar cantidad"
                              :disabled="isQtyUpdating(item.sku)"
                              @click="updateQty(item.sku, item.quantity + 1)"
                            >
                              <IconPlus class="h-4 w-4 stroke-[1.35]" />
                            </button>
                          </div>

                          <div class="text-right">
                            <p
                              v-if="item.originalUnitPrice && item.originalUnitPrice > item.unitPrice"
                              class="text-[10px] font-medium text-lumia-ink/35 line-through"
                            >
                              {{ formatPrice(item.originalUnitPrice, item.currency) }}
                            </p>
                            <p class="text-[11px] font-medium uppercase tracking-wide text-lumia-ink/38">
                              {{ formatPrice(item.unitPrice, item.currency) }} c/u
                              <span v-if="item.promotionPercentOff" class="ml-1 text-lumia-gold">−{{ item.promotionPercentOff }}%</span>
                            </p>
                            <p class="font-display text-[17px] font-semibold tabular-nums text-lumia-ink">
                              {{ formatPrice(item.unitPrice * item.quantity, item.currency) }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-lumia-gold/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
                  </li>
                </TransitionGroup>
              </div>

              <footer
                class="shrink-0 border-t border-lumia-ink/[0.07] bg-lumia-canvas/[0.97] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_40px_-16px_rgba(43,43,43,0.12)] backdrop-blur-xl sm:px-6"
              >
                <CartShippingProgress
                  v-if="freeShippingThreshold > 0"
                  class="mb-4"
                  :subtotal="lineTotal"
                  :threshold="freeShippingThreshold"
                  :remaining-label="freeShippingRemainingLabel"
                />

                <div class="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-amber-50/40 px-4 py-3">
                  <div class="flex gap-3">
                    <IconTruckDelivery class="mt-0.5 h-5 w-5 shrink-0 text-amber-700" stroke-width="1.35" />
                    <div>
                      <p class="text-sm font-semibold text-amber-900">{{ CART_SHIPPING_WARNING_TITLE }}</p>
                      <p class="mt-1 text-xs leading-relaxed text-amber-800/90">{{ CART_SHIPPING_WARNING_MESSAGE }}</p>
                    </div>
                  </div>
                </div>

                <div class="mt-4 space-y-2 text-sm">
                  <div class="flex items-center justify-between text-lumia-ink/65">
                    <span>Subtotal productos</span>
                    <span class="tabular-nums">{{ formatPrice(lineTotal, currency) }}</span>
                  </div>
                  <div class="flex items-start justify-between gap-3 text-lumia-ink/65">
                    <span>Envío</span>
                    <span class="text-right">
                      <span class="font-medium text-amber-800">{{ CART_SHIPPING_ROW_LABEL }}</span>
                      <span class="mt-0.5 block text-[11px] text-lumia-ink/45">{{ CART_SHIPPING_ROW_HINT }}</span>
                    </span>
                  </div>
                  <div class="flex items-center justify-between border-t border-lumia-ink/8 pt-3">
                    <span class="font-medium text-lumia-ink">Total estimado</span>
                    <span class="font-display text-xl font-semibold tabular-nums text-lumia-ink">
                      {{ formatPrice(lineTotal, currency) }}
                    </span>
                  </div>
                  <p class="text-[11px] leading-relaxed text-lumia-ink/45">Sin incluir envío. El total final puede variar.</p>
                </div>

                <ul class="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-lumia-ink/45">
                  <li class="flex items-center gap-1.5">
                    <IconShieldCheck class="h-3.5 w-3.5 text-lumia-gold/80" stroke-width="1.35" />
                    Pago seguro con el vendedor
                  </li>
                  <li class="flex items-center gap-1.5">
                    <IconPackage class="h-3.5 w-3.5 text-lumia-gold/80" stroke-width="1.35" />
                    Preparación artesanal
                  </li>
                </ul>

                <BaseButton
                  to="/checkout"
                  block
                  class="mt-5 min-h-[52px] gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] shadow-[0_14px_40px_-12px_rgba(15,15,15,0.4)]"
                  @click="$emit('update:modelValue', false)"
                >
                  <IconLock class="h-4 w-4 opacity-90" stroke-width="1.35" aria-hidden="true" />
                  Finalizar compra
                </BaseButton>

                <NuxtLink
                  to="/cart"
                  class="mt-4 block py-2 text-center text-[13px] font-semibold text-lumia-ink/48 underline-offset-4 transition hover:text-lumia-ink hover:underline"
                  @click="$emit('update:modelValue', false)"
                >
                  Ver carrito completo
                </NuxtLink>
              </footer>
            </div>
          </aside>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  IconLock,
  IconLoader2,
  IconMinus,
  IconPackage,
  IconPlus,
  IconShieldCheck,
  IconTrash,
  IconTruckDelivery,
  IconX,
} from '@tabler/icons-vue'
import {
  CART_SHIPPING_ROW_HINT,
  CART_SHIPPING_ROW_LABEL,
  CART_SHIPPING_WARNING_MESSAGE,
  CART_SHIPPING_WARNING_TITLE,
  buildFreeShippingRemainingLabel,
} from '~/utils/cart-shipping'

const props = defineProps<{ modelValue: boolean }>()
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const canTeleport = ref(false)
onMounted(() => {
  canTeleport.value = true
})
onBeforeUnmount(() => {
  canTeleport.value = false
})

const cart = useCart()
const { formatPrice } = useUtils()
const { resolveProductImageSrc } = useProductImages()
const config = useRuntimeConfig()

const lineItems = computed(() => cart.items.value)
const lineTotal = computed(() => cart.total.value)
const currency = computed(() => lineItems.value[0]?.currency ?? 'COP')
const countLabel = computed(() => {
  const n = cart.count.value
  return n > 0 ? String(n) : ''
})

const freeShippingThreshold = computed(() => Number(config.public.storeFreeShippingThreshold) || 0)
const freeShippingRemainingLabel = computed(() => {
  const threshold = freeShippingThreshold.value
  if (threshold <= 0) return ''
  const remaining = Math.max(0, threshold - lineTotal.value)
  return buildFreeShippingRemainingLabel(remaining, formatPrice, currency.value)
})

function isQtyUpdating(sku: string) {
  return cart.isQtyUpdating(sku)
}

async function updateQty(sku: string, quantity: number) {
  await cart.updateLineQuantity({ sku }, quantity)
}

async function removeLine(sku: string) {
  await cart.removeItem(sku)
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) void cart.fetchCart()
  }
)
</script>

<style scoped>
.cart-drawer-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(43, 43, 43, 0.18) transparent;
}
.cart-drawer-scroll::-webkit-scrollbar {
  width: 6px;
}
.cart-drawer-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(43, 43, 43, 0.18);
}

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

.cart-line-move,
.cart-line-enter-active,
.cart-line-leave-active {
  transition: all 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
.cart-line-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.cart-line-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
