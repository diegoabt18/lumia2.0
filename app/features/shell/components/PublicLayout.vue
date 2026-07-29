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
const cartOpen = ref(false)
const { fetchCart } = useCart()

onMounted(() => {
  void fetchCart()
})
</script>
