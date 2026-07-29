<template>
  <div class="bg-lumia-canvas pb-24 pt-6">
    <BaseContainer>
      <AppBreadcrumbs
        :items="[
          { label: 'Inicio', to: '/' },
          { label: 'Carrito' },
        ]"
      />

      <div class="mt-6 border-b border-lumia-ink/8 pb-6">
        <p class="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-lumia-gold/80">Checkout</p>
        <h1 class="mt-2 font-display text-3xl text-lumia-ink md:text-4xl">Tu carrito</h1>
        <p v-if="items.length" class="mt-2 text-sm text-lumia-ink/55">
          {{ count }} {{ count === 1 ? 'artículo' : 'artículos' }} · Pago acordado con el vendedor
        </p>
      </div>

      <div v-if="!items.length" class="mt-16 flex flex-col items-center text-center">
        <div class="flex h-20 w-20 items-center justify-center rounded-full bg-lumia-cream/80 text-3xl ring-1 ring-lumia-gold/20">
          🕯️
        </div>
        <p class="mt-6 font-display text-xl text-lumia-ink">Tu carrito está vacío</p>
        <p class="mt-2 max-w-sm text-sm leading-relaxed text-lumia-ink/55">
          Explora la colección y añade tus velas favoritas.
        </p>
        <BaseButton to="/products" variant="secondary" class="mt-8">Explorar catálogo</BaseButton>
      </div>

      <div v-else class="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <TransitionGroup name="cart-line" tag="ul" class="space-y-4">
          <li
            v-for="item in items"
            :key="item.sku"
            class="group relative overflow-hidden rounded-2xl border border-lumia-ink/[0.06] bg-white shadow-soft"
          >
            <div class="flex gap-4 p-4 sm:gap-5 sm:p-5">
              <NuxtLink
                :to="`/products/${item.productSlug}`"
                class="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-lumia-beige/40 ring-1 ring-lumia-ink/[0.05] sm:h-32 sm:w-28"
              >
                <ProductShopImage
                  :src="resolveProductImageSrc(item.productSlug, item.imagePath ?? '')"
                  :alt="item.productName"
                  class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="112px"
                  loading="lazy"
                />
              </NuxtLink>

              <div class="flex min-w-0 flex-1 flex-col">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <NuxtLink
                      :to="`/products/${item.productSlug}`"
                      class="font-display text-lg font-semibold leading-snug text-lumia-ink transition hover:text-lumia-gold sm:text-xl"
                    >
                      {{ item.productName }}
                    </NuxtLink>
                    <p v-if="item.variantLabel" class="mt-1.5 text-sm font-medium text-lumia-ink/60">
                      {{ item.variantLabel }}
                    </p>
                    <p v-else class="mt-1.5 text-xs text-lumia-ink/45">{{ item.sku }}</p>
                  </div>
                  <button
                    type="button"
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lumia-ink/35 transition hover:bg-lumia-ink/[0.05] hover:text-rose-600 active:scale-[0.94]"
                    aria-label="Quitar producto"
                    @click="removeItem(item.sku)"
                  >
                    <IconTrash class="h-4 w-4 stroke-[1.35]" />
                  </button>
                </div>

                <div class="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">
                  <div class="flex items-center gap-0.5 rounded-full border border-lumia-ink/[0.08] bg-lumia-cream/40 p-0.5">
                    <button
                      type="button"
                      class="flex h-10 w-10 items-center justify-center rounded-full text-lumia-ink/70 transition hover:bg-white active:scale-[0.94] disabled:opacity-35"
                      aria-label="Reducir cantidad"
                      :disabled="item.quantity <= 1 || isQtyUpdating(item.sku)"
                      @click="updateLineQuantity(item, item.quantity - 1)"
                    >
                      <IconMinus class="h-4 w-4 stroke-[1.35]" />
                    </button>
                    <span class="relative min-w-[2rem] text-center font-display text-base font-semibold tabular-nums text-lumia-ink">
                      <IconLoader2
                        v-if="isQtyUpdating(item.sku)"
                        class="mx-auto h-4 w-4 animate-spin text-lumia-ink/45"
                        stroke-width="1.35"
                      />
                      <span v-else>{{ item.quantity }}</span>
                    </span>
                    <button
                      type="button"
                      class="flex h-10 w-10 items-center justify-center rounded-full text-lumia-ink/70 transition hover:bg-white active:scale-[0.94] disabled:opacity-35"
                      aria-label="Aumentar cantidad"
                      :disabled="isQtyUpdating(item.sku)"
                      @click="updateLineQuantity(item, item.quantity + 1)"
                    >
                      <IconPlus class="h-4 w-4 stroke-[1.35]" />
                    </button>
                  </div>

                  <div class="text-right">
                    <p class="text-[11px] font-medium uppercase tracking-wide text-lumia-ink/38">
                      {{ formatPrice(item.unitPrice, item.currency) }} c/u
                    </p>
                    <p class="font-display text-xl font-semibold tabular-nums text-lumia-ink">
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

        <aside class="h-fit lg:sticky lg:top-24">
          <div class="rounded-2xl border border-lumia-ink/8 bg-gradient-to-b from-lumia-cream/60 to-white p-6 shadow-soft">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">Resumen del pedido</p>

            <CartShippingProgress
              v-if="freeShippingThreshold > 0"
              class="mt-5"
              :subtotal="total"
              :threshold="freeShippingThreshold"
              :remaining-label="freeShippingRemainingLabel"
            />

            <div class="mt-5 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-amber-50/40 px-4 py-3">
              <div class="flex gap-3">
                <IconTruckDelivery class="mt-0.5 h-5 w-5 shrink-0 text-amber-700" stroke-width="1.35" />
                <div>
                  <p class="text-sm font-semibold text-amber-900">{{ CART_SHIPPING_WARNING_TITLE }}</p>
                  <p class="mt-1 text-xs leading-relaxed text-amber-800/90">{{ CART_SHIPPING_WARNING_MESSAGE }}</p>
                </div>
              </div>
            </div>

            <div class="mt-5 space-y-2.5 text-sm">
              <div class="flex items-center justify-between text-lumia-ink/65">
                <span>Subtotal productos</span>
                <span class="tabular-nums">{{ formatPrice(total, currency) }}</span>
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
                <span class="font-display text-2xl font-semibold tabular-nums text-lumia-ink">
                  {{ formatPrice(total, currency) }}
                </span>
              </div>
              <p class="text-[11px] leading-relaxed text-lumia-ink/45">Sin incluir envío. El total final puede variar.</p>
            </div>

            <ul class="mt-5 flex flex-col gap-2 text-[12px] text-lumia-ink/50">
              <li class="flex items-center gap-2">
                <IconShieldCheck class="h-4 w-4 shrink-0 text-lumia-gold/80" stroke-width="1.35" />
                Pago seguro acordado con el vendedor
              </li>
              <li class="flex items-center gap-2">
                <IconPackage class="h-4 w-4 shrink-0 text-lumia-gold/80" stroke-width="1.35" />
                Preparación artesanal en pequeños lotes
              </li>
            </ul>

            <BaseButton
              to="/checkout"
              variant="primary"
              block
              class="mt-6 min-h-[52px] gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] shadow-[0_14px_40px_-12px_rgba(15,15,15,0.35)]"
            >
              <IconLock class="h-4 w-4 opacity-90" stroke-width="1.35" aria-hidden="true" />
              Ir al checkout
            </BaseButton>
            <BaseButton :to="continuePath" variant="ghost" block class="mt-3">
              Seguir comprando
            </BaseButton>
          </div>
        </aside>
      </div>
    </BaseContainer>
  </div>
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
} from '@tabler/icons-vue'
import {
  CART_SHIPPING_ROW_HINT,
  CART_SHIPPING_ROW_LABEL,
  CART_SHIPPING_WARNING_MESSAGE,
  CART_SHIPPING_WARNING_TITLE,
  buildFreeShippingRemainingLabel,
} from '~/utils/cart-shipping'

const { items, count, total, removeItem, updateLineQuantity, isQtyUpdating } = useCart()
const { formatPrice } = useUtils()
const { resolveProductImageSrc } = useProductImages()
const config = useRuntimeConfig()
const continuePath = config.public.cartContinueShoppingPath || '/products'

const currency = computed(() => items.value[0]?.currency ?? 'COP')
const freeShippingThreshold = computed(() => Number(config.public.storeFreeShippingThreshold) || 0)
const freeShippingRemainingLabel = computed(() => {
  const threshold = freeShippingThreshold.value
  if (threshold <= 0) return ''
  const remaining = Math.max(0, threshold - total.value)
  return buildFreeShippingRemainingLabel(remaining, formatPrice, currency.value)
})

useHead({ title: 'Carrito — LUMIA' })
</script>

<style scoped>
.cart-line-move,
.cart-line-enter-active,
.cart-line-leave-active {
  transition: all 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
.cart-line-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.cart-line-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
