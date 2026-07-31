<template>
  <div class="flex min-h-screen flex-col bg-lumia-canvas transition-[background-color] duration-300 dark:bg-zinc-950">
    <AppNavbar @open-cart="cartOpen = true" />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
    <LazyCartDrawer v-model="cartOpen" />
  </div>
</template>

<script setup lang="ts">
import type { CartItem } from '#shared/types/product'
import { useCartStore } from '~/features/cart/stores/cart'

const cartOpen = ref(false)
const cartStore = useCartStore()

onMounted(() => {
  scheduleIdle(async () => {
    const payload = await $fetch<{ items: CartItem[]; source?: string }>('/api/cart', { timeout: 5_000 }).catch(
      () => ({ items: [], source: 'local' as const })
    )
    if (payload.source === 'api' || payload.source === 'mongo') {
      cartStore.$patch({ items: payload.items ?? [], apiEnabled: true })
    } else if (payload.source === 'local') {
      cartStore.$patch({ apiEnabled: false })
    }
    void useWishlist().load()
  })
})
</script>
