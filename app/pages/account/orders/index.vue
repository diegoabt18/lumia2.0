<template>
  <BaseContainer class="py-16">
    <h1 class="font-display text-3xl text-lumia-ink">Mis pedidos</h1>

    <div v-if="!user" class="mt-8 rounded-2xl border border-lumia-ink/8 bg-white/70 p-6">
      <p class="text-lumia-ink/60">Inicia sesión para ver el historial de tus pedidos.</p>
      <BaseButton to="/auth/login?redirect=/account/orders" variant="primary" class="mt-6">Entrar</BaseButton>
    </div>

    <div v-else-if="pending" class="mt-10 text-sm text-lumia-ink/45">Cargando pedidos…</div>

    <div v-else-if="!orders.length" class="mt-10 rounded-2xl border border-dashed border-lumia-ink/15 bg-lumia-cream/40 p-10 text-center">
      <p class="text-lumia-ink/70">Aún no tienes pedidos.</p>
      <BaseButton to="/products" variant="secondary" class="mt-6">Explorar catálogo</BaseButton>
    </div>

    <ul v-else class="mt-10 space-y-4">
      <li
        v-for="order in orders"
        :key="order.orderNumber"
        class="rounded-2xl border border-lumia-ink/8 bg-white/70 p-5 shadow-soft"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="font-display text-lg text-lumia-ink">{{ order.orderNumber }}</p>
            <p class="mt-1 text-sm text-lumia-ink/55">{{ formatStoreDate(order.createdAt) }}</p>
          </div>
          <div class="text-right">
            <p class="font-display text-lg text-lumia-ink">{{ formatPrice(order.total, order.currency) }}</p>
            <p class="mt-1 text-xs uppercase tracking-wide text-lumia-ink/45">{{ statusLabel(order.paymentStatus) }}</p>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-3">
          <BaseButton :to="`/thank-you/${encodeURIComponent(order.orderNumber)}`" variant="ghost">
            Ver detalle
          </BaseButton>
        </div>
      </li>
    </ul>
  </BaseContainer>
</template>

<script setup lang="ts">
import type { OrderSummary } from '#shared/types/order'

const { user } = useAuth()
const { formatPrice, formatStoreDate } = useUtils()

const { data, pending } = await useAsyncData('account-orders', () =>
  $fetch<{ orders: OrderSummary[] }>('/api/orders/mine').catch(() => ({ orders: [] }))
)

const orders = computed(() => data.value?.orders ?? [])

function statusLabel(status: string) {
  if (status === 'pending_manual') return 'Pago pendiente'
  if (status === 'paid') return 'Pagado'
  return status
}

useHead({ title: 'Mis pedidos — LUMIA' })
</script>
