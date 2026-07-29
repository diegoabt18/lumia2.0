<template>
  <div class="flex min-h-screen flex-col bg-lumia-canvas transition-[background-color] duration-300 dark:bg-zinc-950">
    <AppNavbar @open-cart="cartOpen = true" />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
    <CartDrawer v-model="cartOpen" />
  </div>
</template>

<script setup lang="ts">
import type { CartItem } from '#shared/types/product'
import { useCartStore } from '~/features/cart/stores/cart'

const cartOpen = ref(false)
const cartStore = useCartStore()

const { data: cartBootstrap } = await useAsyncData('layout-cart', () =>
  $fetch<{ items: CartItem[]; source?: string }>('/api/cart').catch(() => ({ items: [], source: 'local' as const }))
)

if (cartBootstrap.value?.source === 'mongo') {
  cartStore.$patch({
    items: cartBootstrap.value.items ?? [],
    apiEnabled: true,
  })
} else if (cartBootstrap.value?.source === 'local') {
  cartStore.$patch({ apiEnabled: false })
}

onMounted(() => {
  void cartStore.fetchCart()
  void useWishlist().load()
})
</script>
