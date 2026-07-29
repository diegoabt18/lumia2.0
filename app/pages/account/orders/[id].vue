<template>
  <div class="bg-lumia-canvas pb-24 pt-6 md:pt-10">
    <BaseContainer>
      <AppBreadcrumbs
        :items="[
          { label: 'Inicio', to: '/' },
          { label: 'Mis pedidos', to: '/account/orders' },
          { label: 'Detalle' },
        ]"
      />

      <div class="mx-auto mt-8 max-w-2xl">
        <template v-if="errorMessage">
          <div class="text-center">
            <h1 class="font-display text-3xl text-lumia-ink">Orden no encontrada</h1>
            <p class="mt-3 text-lumia-ink/65">{{ errorMessage }}</p>
            <BaseButton to="/account/orders" class="mt-8">Mis pedidos</BaseButton>
          </div>
        </template>

        <template v-else-if="pending">
          <div class="space-y-4 py-16">
            <div class="mx-auto h-16 w-16 animate-pulse rounded-full bg-lumia-beige/70" />
            <div class="mx-auto h-6 w-48 animate-pulse rounded bg-lumia-beige/60" />
            <div class="mx-auto h-4 w-64 animate-pulse rounded bg-lumia-beige/40" />
          </div>
        </template>

        <OrderDetailPanel v-else-if="order" :order="order" is-history-view />
      </div>
    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import type { OrderSummary } from '#shared/types/order'

const route = useRoute()
const { user, loaded: authLoaded } = useAuth()

const orderId = computed(() => String(route.params.id ?? ''))

const { data: order, pending, error, refresh } = await useAsyncData(
  () => `account-order-${orderId.value}`,
  () => $fetch<OrderSummary>(`/api/orders/mine/${encodeURIComponent(orderId.value)}`),
  { immediate: false, server: false }
)

watch(
  [orderId, user, authLoaded],
  ([id, u, loaded]) => {
    if (loaded && u && id) void refresh()
  },
  { immediate: true }
)

const errorMessage = computed(() => {
  if (authLoaded.value && !user.value) {
    return 'Inicia sesión para ver el detalle de tus pedidos.'
  }
  if (!error.value) return ''
  const err = error.value as { data?: { message?: string }; message?: string }
  return err?.data?.message || err?.message || 'No encontramos este pedido.'
})

useHead({ title: 'Detalle del pedido — LUMIA' })
</script>
