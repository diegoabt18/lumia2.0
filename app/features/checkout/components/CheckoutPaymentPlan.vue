<template>
  <section
    class="min-w-0 rounded-xl border border-lumia-ink/8 bg-white p-4 shadow-soft sm:rounded-2xl sm:p-6"
    aria-labelledby="checkout-payment-plan-title"
  >
    <p id="checkout-payment-plan-title" class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">
      Pago inicial y saldo
    </p>

    <p v-if="error" role="alert" class="mt-3 rounded-lg bg-status-danger-soft/50 px-3 py-2.5 text-[13px] text-status-danger">
      {{ error }}
    </p>

    <div v-else-if="loading && !quote" class="mt-4 space-y-2" aria-live="polite">
      <div class="h-5 w-2/3 animate-pulse rounded bg-lumia-ink/8" />
      <div class="h-5 w-1/2 animate-pulse rounded bg-lumia-ink/8" />
    </div>

    <template v-else-if="quote">
      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl bg-lumia-cream/60 p-4">
          <p class="text-[12px] text-lumia-ink/55">Paga ahora</p>
          <p class="mt-1 font-display text-2xl tabular-nums text-lumia-ink">
            {{ formatPrice(quote.initialPaymentRequired, quote.currency) }}
          </p>
        </div>
        <div class="rounded-xl bg-lumia-cream/60 p-4">
          <p class="text-[12px] text-lumia-ink/55">Saldo posterior</p>
          <p class="mt-1 font-display text-2xl tabular-nums text-lumia-ink">
            {{ formatPrice(quote.balanceDue, quote.currency) }}
          </p>
        </div>
      </div>

      <ul class="mt-5 divide-y divide-lumia-ink/8" :aria-busy="loading">
        <li v-for="item in quote.items" :key="item.sku" class="py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-lumia-ink">{{ item.name }}</p>
              <p v-if="item.variantLabel" class="text-xs text-lumia-ink/55">{{ item.variantLabel }}</p>
              <p class="mt-1 text-xs text-lumia-ink/55">
                {{ item.quantity }} × {{ formatPrice(item.unitPrice, quote.currency) }}
              </p>
            </div>
            <span
              class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
              :class="item.fulfillmentMode === 'made_to_order' ? 'bg-status-info-soft text-status-info' : 'bg-lumia-cream text-lumia-ink/70'"
            >
              {{ item.fulfillmentMode === 'made_to_order' ? 'Por pedido' : 'Stock' }}
            </span>
          </div>
          <dl class="mt-2 grid grid-cols-3 gap-2 text-xs tabular-nums text-lumia-ink/70">
            <div>
              <dt class="text-lumia-ink/45">Total</dt>
              <dd>{{ formatPrice(item.subtotal, quote.currency) }}</dd>
            </div>
            <div>
              <dt class="text-lumia-ink/45">Paga ahora</dt>
              <dd>{{ formatPrice(item.initialPaymentRequired, quote.currency) }}</dd>
            </div>
            <div>
              <dt class="text-lumia-ink/45">Saldo</dt>
              <dd>{{ formatPrice(item.balanceDue, quote.currency) }}</dd>
            </div>
          </dl>
        </li>
      </ul>

      <p class="mt-4 text-[12px] leading-relaxed text-lumia-ink/55">
        Los productos de stock se pagan completos. Los productos por pedido requieren el anticipo indicado.
        El saldo restante se pagará posteriormente mediante los métodos de pago disponibles en la tienda.
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { CheckoutQuote } from '~/composables/useCheckoutQuote'

defineProps<{
  quote: CheckoutQuote | null
  loading: boolean
  error: string | null
}>()

const { formatPrice } = useUtils()
</script>
