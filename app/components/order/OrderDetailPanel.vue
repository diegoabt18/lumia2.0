<template>
  <div>
    <div class="text-center">
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
        :class="isHistoryView ? 'bg-lumia-cream' : 'bg-amber-100'"
      >
        <span class="text-2xl" :class="isHistoryView ? 'text-lumia-ink/70' : 'text-amber-700'">
          {{ isHistoryView ? '📦' : '⏳' }}
        </span>
      </div>
      <h1 class="mt-6 font-display text-3xl font-medium text-lumia-ink md:text-4xl">
        {{ isHistoryView ? 'Detalle del pedido' : '¡Pedido recibido!' }}
      </h1>
      <p class="mt-3 text-lumia-ink/65">
        {{
          isHistoryView
            ? 'Resumen de tu compra y estado actual.'
            : 'Hemos registrado tu solicitud. El vendedor se comunicará contigo para coordinar el pago y la entrega.'
        }}
      </p>
    </div>

    <div class="mt-8 rounded-xl border border-lumia-ink/8 bg-white p-6 shadow-soft">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Número de pedido</p>
          <p class="mt-1 font-display text-2xl text-lumia-ink">{{ order.orderNumber }}</p>
          <p class="mt-2 text-sm text-lumia-ink/55">{{ formatStoreDate(order.createdAt) }}</p>
        </div>
        <p class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">{{ statusLabel(order.paymentStatus) }}</p>
      </div>
      <p class="mt-4 text-sm text-lumia-ink/60">
        Total: <span class="font-medium text-lumia-ink">{{ formatPrice(order.total, order.currency) }}</span>
      </p>
    </div>

    <div v-if="order.items.length" class="mt-6 rounded-xl border border-lumia-ink/8 bg-white p-6">
      <h2 class="font-semibold text-lumia-ink">Productos</h2>
      <ul class="mt-4 divide-y divide-lumia-ink/8">
        <li v-for="item in order.items" :key="item.sku" class="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p class="font-medium text-lumia-ink">{{ item.name }}</p>
            <p v-if="item.variantLabel" class="text-sm text-lumia-ink/60">{{ item.variantLabel }}</p>
            <p class="text-xs text-lumia-ink/45">{{ item.quantity }} × {{ formatPrice(item.unitPrice, order.currency) }}</p>
          </div>
          <p class="font-medium text-lumia-ink">{{ formatPrice(item.subtotal, order.currency) }}</p>
        </li>
      </ul>
      <div class="mt-4 space-y-1 border-t border-lumia-ink/8 pt-4 text-sm text-lumia-ink/70">
        <div class="flex justify-between"><span>Subtotal</span><span>{{ formatPrice(order.subtotal, order.currency) }}</span></div>
        <div class="flex justify-between"><span>Envío</span><span>{{ formatPrice(order.shippingCost, order.currency) }}</span></div>
        <div class="flex justify-between font-semibold text-lumia-ink"><span>Total</span><span>{{ formatPrice(order.total, order.currency) }}</span></div>
      </div>
    </div>

    <div class="mt-6 rounded-xl border border-lumia-ink/8 bg-white p-6">
      <h2 class="font-semibold text-lumia-ink">Entrega</h2>
      <dl class="mt-4 space-y-2 text-sm text-lumia-ink/75">
        <div><dt class="text-lumia-ink/45">Nombre</dt><dd>{{ order.customerName }}</dd></div>
        <div><dt class="text-lumia-ink/45">Teléfono</dt><dd>{{ order.phone }}</dd></div>
        <div v-if="order.email"><dt class="text-lumia-ink/45">Email</dt><dd>{{ order.email }}</dd></div>
        <div><dt class="text-lumia-ink/45">Dirección</dt><dd>{{ order.address }}, {{ order.city }}</dd></div>
        <div v-if="order.reference"><dt class="text-lumia-ink/45">Referencia</dt><dd>{{ order.reference }}</dd></div>
        <div v-if="order.notes"><dt class="text-lumia-ink/45">Notas</dt><dd>{{ order.notes }}</dd></div>
      </dl>
    </div>

    <div v-if="!isHistoryView" class="mt-6 rounded-xl border border-lumia-ink/8 bg-white p-6">
      <h2 class="font-semibold text-lumia-ink">¿Qué sigue?</h2>
      <ol class="mt-4 list-inside list-decimal space-y-2 text-sm text-lumia-ink/70">
        <li>Te contactaremos al {{ order.phone }}.</li>
        <li>Acordamos el método de pago (transferencia, efectivo, etc.).</li>
        <li>Cuando confirmemos el pago, preparamos y enviamos tu pedido.</li>
      </ol>
    </div>

    <div v-if="isHistoryView && canCancel" class="mt-6 rounded-xl border border-rose-200 bg-rose-50/60 p-6">
      <h2 class="font-semibold text-lumia-ink">Cancelar pedido</h2>
      <p class="mt-2 text-sm text-lumia-ink/65">
        {{
          canDirectCancel
            ? 'Puedes cancelar este pedido mientras no esté pagado.'
            : 'Puedes solicitar la cancelación; el equipo revisará tu solicitud.'
        }}
      </p>
      <textarea
        v-model="cancelReason"
        rows="3"
        class="lumia-field-input mt-4 resize-y"
        placeholder="Motivo (opcional)"
      />
      <BaseButton
        type="button"
        variant="secondary"
        class="mt-4 border-rose-300 text-rose-700"
        :disabled="cancelPending"
        @click="onCancel"
      >
        {{ cancelPending ? 'Procesando…' : canDirectCancel ? 'Cancelar pedido' : 'Solicitar cancelación' }}
      </BaseButton>
      <p v-if="cancelMessage" class="mt-3 text-sm text-lumia-ink/70">{{ cancelMessage }}</p>
    </div>

    <div v-if="whatsappOrder" class="mt-6">
      <WhatsAppOrderButton :order="whatsappOrder" />
    </div>

    <div class="mt-8 flex flex-col gap-3">
      <BaseButton v-if="user" to="/account/orders">Mis pedidos</BaseButton>
      <BaseButton to="/products" variant="secondary">Seguir comprando</BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrderSummary } from '#shared/types/order'
import type { OrderForWhatsApp } from '#shared/whatsapp-message'

const props = withDefaults(
  defineProps<{
    order: OrderSummary
    isHistoryView?: boolean
  }>(),
  { isHistoryView: false }
)

const emit = defineEmits<{ (e: 'updated'): void }>()

const { formatPrice, formatStoreDate } = useUtils()
const { user } = useAuth()
const toast = useToast()

const cancelReason = ref('')
const cancelPending = ref(false)
const cancelMessage = ref('')

const canDirectCancel = computed(
  () =>
    props.order.paymentStatus === 'pending_manual' &&
    !['cancelled', 'shipped', 'delivered', 'expired'].includes(props.order.status)
)

const canRequestCancel = computed(
  () =>
    props.order.paymentStatus === 'paid' &&
    !props.order.cancellationRequested &&
    !['cancelled', 'delivered', 'expired'].includes(props.order.status)
)

const canCancel = computed(() => props.isHistoryView && (canDirectCancel.value || canRequestCancel.value))

async function onCancel() {
  cancelPending.value = true
  cancelMessage.value = ''
  try {
    const path = canDirectCancel.value
      ? `/api/orders/${encodeURIComponent(props.order.id)}/cancel`
      : `/api/orders/${encodeURIComponent(props.order.id)}/cancel-request`
    const body = canDirectCancel.value
      ? { reason: cancelReason.value.trim() || undefined }
      : { reason: cancelReason.value.trim() || 'Solicitud del cliente' }
    const res = await $fetch<{ message?: string }>(path, { method: 'POST', body })
    cancelMessage.value = res.message ?? 'Listo'
    toast.success(cancelMessage.value)
    emit('updated')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? 'No se pudo procesar la cancelación')
  } finally {
    cancelPending.value = false
  }
}

function statusLabel(status: string) {
  if (status === 'pending_manual') return 'Pago pendiente'
  if (status === 'paid') return 'Pagado'
  return status
}

const whatsappOrder = computed<OrderForWhatsApp | null>(() => {
  const o = props.order
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
      name: i.variantLabel ? `${i.name} — ${i.variantLabel}` : i.name,
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
</script>
