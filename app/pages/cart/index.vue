<template>
  <div class="bg-lumia-canvas pb-20 pt-6">
    <BaseContainer>
      <AppBreadcrumbs
        :items="[
          { label: 'Inicio', to: '/' },
          { label: 'Carrito' },
        ]"
      />

      <h1 class="mt-6 font-display text-3xl text-lumia-ink md:text-4xl">Tu carrito</h1>

      <div v-if="!items.length" class="mt-16 text-center">
        <p class="font-display text-xl text-lumia-ink/70">Tu carrito está vacío</p>
        <BaseButton to="/products" variant="secondary" class="mt-8">Explorar catálogo</BaseButton>
      </div>

      <div v-else class="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul class="space-y-4">
          <li
            v-for="item in items"
            :key="item.sku"
            class="flex gap-4 rounded-2xl border border-lumia-ink/8 bg-white/70 p-4 shadow-soft"
          >
            <NuxtLink :to="`/products/${item.productSlug}`" class="h-24 w-20 shrink-0 overflow-hidden rounded-xl">
              <ProductShopImage
                :src="resolveProductImageSrc(item.productSlug, item.imagePath ?? '')"
                :alt="item.productName"
                class="h-full w-full object-cover"
                sizes="80px"
              />
            </NuxtLink>
            <div class="min-w-0 flex-1">
              <NuxtLink :to="`/products/${item.productSlug}`" class="font-display text-lg text-lumia-ink hover:text-lumia-gold">
                {{ item.productName }}
              </NuxtLink>
              <p class="mt-1 text-sm text-lumia-ink/50">{{ item.sku }}</p>
              <p class="mt-2 font-display text-base text-lumia-ink">
                {{ formatPrice(item.unitPrice * item.quantity, item.currency) }}
              </p>
              <div class="mt-4 flex flex-wrap items-center gap-3">
                <PdpQuantityStepper
                  :model-value="item.quantity"
                  :max="99"
                  @update:model-value="(q) => updateLineQuantity(item, q)"
                />
                <button type="button" class="text-xs text-lumia-ink/45 underline-offset-2 hover:text-rose-600 hover:underline" @click="removeItem(item.sku)">
                  Quitar
                </button>
              </div>
            </div>
          </li>
        </ul>

        <aside class="h-fit rounded-2xl border border-lumia-ink/8 bg-lumia-cream/50 p-6 shadow-soft">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">Resumen</p>
          <p class="mt-4 font-display text-3xl text-lumia-ink">{{ formatPrice(total) }}</p>
          <p class="mt-2 text-sm text-lumia-ink/55">{{ count }} {{ count === 1 ? 'artículo' : 'artículos' }}</p>
          <BaseButton to="/checkout" variant="primary" block class="mt-8">Ir al checkout</BaseButton>
          <BaseButton :to="continuePath" variant="ghost" block class="mt-3">Seguir comprando</BaseButton>
        </aside>
      </div>
    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
const { items, count, total, removeItem, updateLineQuantity } = useCart()
const { formatPrice } = useUtils()
const { resolveProductImageSrc } = useProductImages()
const config = useRuntimeConfig()
const continuePath = config.public.cartContinueShoppingPath || '/products'

useHead({ title: 'Carrito — LUMIA' })
</script>
