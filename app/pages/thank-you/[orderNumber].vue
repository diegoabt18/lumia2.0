<template>
  <div class="bg-lumia-canvas pb-24 pt-6 md:pt-10">
    <BaseContainer>
      <div class="mx-auto max-w-lg">
        <template v-if="errorMessage">
          <div class="text-center">
            <h1 class="font-display text-3xl text-lumia-ink">Orden no encontrada</h1>
            <p class="mt-3 text-lumia-ink/65">{{ errorMessage }}</p>
            <BaseButton to="/checkout" class="mt-8">Volver al checkout</BaseButton>
          </div>
        </template>

        <template v-else-if="pending">
          <p class="py-16 text-center text-sm text-lumia-ink/45">Cargando información del pedido…</p>
        </template>

        <template v-else-if="order">
          <div class="text-center">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <span class="text-2xl text-amber-700">⏳</span>
            </div>
            <h1 class="mt-6 font-display text-3xl font-medium text-lumia-ink md:text-4xl">¡Pedido recibido!</h1>
            <p class="mt-3 text-lumia-ink/65">
              Hemos registrado tu solicitud. El vendedor se comunicará contigo para coordinar el pago y la entrega.
            </p>
          </div>

          <div class="mt-8 rounded-xl border border-lumia-ink/8 bg-white p-6 shadow-soft">
            <p class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Número de pedido</p>
            <p class="mt-1 font-display text-2xl text-lumia-ink">{{ order.orderNumber }}</p>
            <p class="mt-4 text-sm text-lumia-ink/60">
              Total: <span class="font-medium text-lumia-ink">{{ formatPrice(order.total, order.currency) }}</span>
            </p>
            <p class="mt-1 text-sm text-lumia-ink/60">Estado: Pendiente de confirmación del vendedor</p>
          </div>

          <div class="mt-6 rounded-xl border border-lumia-ink/8 bg-white p-6">
            <h2 class="font-semibold text-lumia-ink">¿Qué sigue?</h2>
            <ol class="mt-4 list-inside list-decimal space-y-2 text-sm text-lumia-ink/70">
              <li>Te contactaremos al {{ order.phone }}.</li>
              <li>Acordamos el método de pago (transferencia, efectivo, etc.).</li>
              <li>Cuando confirmemos el pago, preparamos y enviamos tu pedido.</li>
            </ol>
          </div>

          <div v-if="whatsappOrder" class="mt-6">
            <WhatsAppOrderButton :order="whatsappOrder" />
          </div>

          <div class="mt-8 flex flex-col gap-3">
            <BaseButton v-if="user" to="/account/orders">Mis pedidos</BaseButton>
            <BaseButton to="/products" variant="secondary">Seguir comprando</BaseButton>
          </div>
        </template>
      </div>
    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import type { OrderSummary } from '#shared/types/order'
import type { OrderForWhatsApp } from '#shared/whatsapp-message'

const route = useRoute()
const { formatPrice } = useUtils()
const { user } = useAuth()

const orderNumber = computed(() => String(route.params.orderNumber ?? ''))

const { data: order, pending, error } = await useAsyncData(
  () => `thank-you-${orderNumber.value}`,
  () => $fetch<OrderSummary>(`/api/orders/by-number/${encodeURIComponent(orderNumber.value)}`),
  { watch: [orderNumber] }
)

const errorMessage = computed(() => {
  if (!error.value) return ''
  const err = error.value as { data?: { message?: string }; message?: string }
  return err?.data?.message || err?.message || 'No encontramos este pedido.'
})

const whatsappOrder = computed<OrderForWhatsApp | null>(() => {
  const o = order.value
  if (!o) return null
  return {
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    customerName: o.customerName,
    phone: o.phone,
    email: o.email,
    address: o.address,
    city: o.city,
    reference: o.reference,
    paymentMethod: 'Pago acordado con el vendedor',
    status: o.paymentStatus,
    items: o.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    })),
    subtotal: o.subtotal,
    shippingCost: o.shippingCost,
    total: o.total,
    currency: o.currency,
    notes: o.notes ?? null,
  }
})

useHead(() => ({
  title: order.value?.orderNumber ? `Pedido ${order.value.orderNumber} — LUMIA` : 'Gracias — LUMIA',
}))
</script>
