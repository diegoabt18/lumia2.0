<template>
  <div class="bg-lumia-canvas pb-24 pt-6 md:pt-10">
    <BaseContainer>
      <div class="mx-auto max-w-2xl">
        <template v-if="errorMessage">
          <div class="text-center">
            <h1 class="font-display text-3xl text-lumia-ink">Enlace no válido</h1>
            <p class="mt-3 text-lumia-ink/65">{{ errorMessage }}</p>
            <div class="mt-8 flex flex-col items-center gap-3">
              <BaseButton v-if="user" to="/account/orders">Mis pedidos</BaseButton>
              <BaseButton to="/products" variant="secondary">Ir al catálogo</BaseButton>
            </div>
          </div>
        </template>

        <template v-else-if="pending">
          <div class="space-y-4 py-16">
            <div class="mx-auto h-16 w-16 animate-pulse rounded-full bg-lumia-beige/70" />
            <div class="mx-auto h-6 w-48 animate-pulse rounded bg-lumia-beige/60" />
            <div class="mx-auto h-4 w-64 animate-pulse rounded bg-lumia-beige/40" />
          </div>
        </template>

        <OrderDetailPanel v-else-if="order" :order="order" />
      </div>
    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import type { OrderSummary } from '#shared/types/order'

const route = useRoute()
const { user } = useAuth()

const accessToken = computed(() => (typeof route.query.token === 'string' ? route.query.token.trim() : ''))

const { data: order, pending, error } = await useAsyncData(
  () => `thank-you-${accessToken.value || 'missing'}`,
  () => {
    if (!accessToken.value) return Promise.resolve(null)
    return $fetch<OrderSummary>('/api/orders/view', { query: { token: accessToken.value } })
  },
  { watch: [accessToken] }
)

const errorMessage = computed(() => {
  if (!accessToken.value) {
    return 'Usa el enlace que recibiste al confirmar el pedido o entra a Mis pedidos si tienes cuenta.'
  }
  if (!error.value) return ''
  const err = error.value as { data?: { message?: string }; message?: string }
  return err?.data?.message || err?.message || 'No encontramos este pedido.'
})

useHead({
  title: 'Gracias — LUMIA',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
