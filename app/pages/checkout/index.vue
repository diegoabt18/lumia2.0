<template>
  <div class="bg-lumia-canvas pb-32 pt-4 sm:pb-28 sm:pt-6 md:pt-10 lg:pb-24">
    <BaseContainer>
      <AppBreadcrumbs
        class="hidden sm:block"
        :items="[{ label: 'Inicio', to: '/' }, { label: 'Carrito', to: '/cart' }, { label: 'Checkout' }]"
      />

      <div class="mt-4 sm:mt-8">
        <p class="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-lumia-gold/80 lg:hidden">
          Checkout
        </p>
        <h1 class="mt-1 font-display text-2xl font-medium text-lumia-ink sm:mt-0 sm:text-4xl md:text-5xl">
          Finalizar pedido
        </h1>
        <p class="mt-2 text-sm text-lumia-ink/60 sm:mt-4 sm:max-w-2xl sm:text-base">
          <span class="lg:hidden">Revisa tu pedido y completa el envío.</span>
          <span class="hidden lg:inline">
            Completa tus datos de envío. El pago se coordina directamente con el vendedor (transferencia, efectivo, etc.).
          </span>
        </p>
      </div>

      <div v-if="!items.length" class="mt-10 rounded-2xl border border-dashed border-lumia-ink/15 bg-lumia-cream/40 p-8 text-center sm:mt-12 sm:p-10">
        <p class="text-lumia-ink/70">Tu carrito está vacío.</p>
        <BaseButton to="/products" class="mt-6">Ir al catálogo</BaseButton>
      </div>

      <div v-else class="mx-auto mt-5 max-w-5xl sm:mt-8 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
        <CheckoutMobileOrderPanel
          ref="mobileOrderPanelRef"
          :items="items"
          :count="count"
          :subtotal="total"
          :shipping-cost="shippingQuote.shippingCost"
          :grand-total="shippingQuote.grandTotal"
          :shipping-variable="shippingQuote.variable"
          :free-shipping="shippingQuote.freeShipping"
        />

        <CheckoutOrderSummary
          class="lg:order-2"
          :items="items"
          :count="count"
          :subtotal="total"
          :shipping-cost="shippingQuote.shippingCost"
          :grand-total="shippingQuote.grandTotal"
          :shipping-variable="shippingQuote.variable"
          :free-shipping="shippingQuote.freeShipping"
        />

        <div class="mt-4 rounded-2xl border border-lumia-ink/8 bg-white p-4 shadow-soft sm:mt-6 sm:p-6 md:p-8 lg:order-1 lg:mt-0">
          <div class="mb-5 flex flex-col gap-3 rounded-xl border border-lumia-ink/10 bg-lumia-cream/35 p-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:p-6">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Identificación</p>
              <p v-if="user" class="mt-1.5 text-sm text-lumia-ink/65 sm:mt-2">
                Sesión activa: el pedido quedará vinculado a tu cuenta.
              </p>
              <p v-else class="mt-1.5 text-sm text-lumia-ink/65 sm:mt-2">
                Entra con Google o compra como invitado.
              </p>
            </div>
            <GoogleSignInButton v-if="!user" class="w-full shrink-0 sm:w-auto sm:min-w-[240px]" @click="loginWithGoogle('/checkout')" />
          </div>

          <form id="checkout-form" @submit.prevent="onSubmit">
            <h2 class="font-display text-lg text-lumia-ink sm:text-xl">Datos de envío</h2>
            <p class="mt-1 text-sm text-lumia-ink/55">Los usaremos solo para este pedido.</p>

            <div class="mt-5 grid gap-4 sm:mt-6 sm:gap-5 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="customerName">Nombre completo</label>
                <input id="customerName" v-model="form.customerName" type="text" autocomplete="name" class="lumia-field-input min-h-12" :class="fieldError('customerName') && 'border-rose-400'" />
                <p v-if="fieldError('customerName')" class="mt-1 text-xs text-rose-600">{{ fieldError('customerName') }}</p>
              </div>

              <div v-if="!user" class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="email">Email</label>
                <input id="email" v-model="form.email" type="email" autocomplete="email" inputmode="email" placeholder="tu@email.com" class="lumia-field-input min-h-12" :class="fieldError('email') && 'border-rose-400'" />
                <p v-if="fieldError('email')" class="mt-1 text-xs text-rose-600">{{ fieldError('email') }}</p>
                <p v-else class="mt-1 text-xs text-lumia-ink/50">Te enviaremos la confirmación del pedido.</p>
              </div>
              <p v-else-if="user?.email" class="sm:col-span-2 text-sm text-lumia-ink/60">
                Confirmación a <span class="font-medium text-lumia-ink">{{ user.email }}</span>
              </p>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="phone">Teléfono / WhatsApp</label>
                <input id="phone" v-model="form.phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="Ej. +57 300 1234567" class="lumia-field-input min-h-12" :class="fieldError('phone') && 'border-rose-400'" />
                <p v-if="fieldError('phone')" class="mt-1 text-xs text-rose-600">{{ fieldError('phone') }}</p>
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="address">Dirección</label>
                <input id="address" v-model="form.address" type="text" autocomplete="street-address" class="lumia-field-input min-h-12" :class="fieldError('address') && 'border-rose-400'" />
                <p v-if="fieldError('address')" class="mt-1 text-xs text-rose-600">{{ fieldError('address') }}</p>
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="city">Ciudad</label>
                <input id="city" v-model="form.city" type="text" autocomplete="address-level2" class="lumia-field-input min-h-12" :class="fieldError('city') && 'border-rose-400'" />
                <p v-if="fieldError('city')" class="mt-1 text-xs text-rose-600">{{ fieldError('city') }}</p>
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="reference">Referencia</label>
                <input id="reference" v-model="form.reference" type="text" placeholder="Torre, apto, barrio…" class="lumia-field-input min-h-12" :class="fieldError('reference') && 'border-rose-400'" />
                <p v-if="fieldError('reference')" class="mt-1 text-xs text-rose-600">{{ fieldError('reference') }}</p>
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="notes">Notas (opcional)</label>
                <textarea id="notes" v-model="form.notes" rows="3" class="lumia-field-input min-h-[5.5rem] resize-y" />
              </div>
            </div>

            <div class="mt-5 rounded-xl border border-lumia-gold/20 bg-lumia-gold/5 p-3.5 sm:mt-6 sm:p-4">
              <p class="text-sm font-medium text-lumia-ink">Pago acordado con el vendedor</p>
              <p class="mt-1 text-xs leading-relaxed text-lumia-ink/60">
                Al confirmar, registramos tu pedido y te contactamos para acordar transferencia, efectivo u otro método.
              </p>
            </div>

            <label
              for="accept-terms"
              class="mt-5 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-transparent px-1 py-2 transition has-[:checked]:border-lumia-gold/25 has-[:checked]:bg-lumia-gold/5 sm:mt-6"
            >
              <input id="accept-terms" v-model="acceptTerms" type="checkbox" class="mt-0.5 h-5 w-5 shrink-0 rounded border-lumia-ink/20" />
              <span class="text-xs leading-relaxed text-lumia-ink/60">
                Acepto los
                <NuxtLink to="/legal/terms" class="font-medium text-lumia-gold underline" @click.stop> Términos </NuxtLink>
                y la
                <NuxtLink to="/legal/privacy" class="font-medium text-lumia-gold underline" @click.stop> Política de Privacidad </NuxtLink>.
              </span>
            </label>

            <SecurityTurnstileWidget
              v-if="turnstileSiteKey"
              ref="turnstileRef"
              :site-key="turnstileSiteKey"
              class="mt-5 sm:mt-6"
              @token="onTurnstileToken"
            />

            <p v-if="submitError" id="checkout-submit-error" class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              {{ submitError }}
            </p>

            <div class="mt-8 hidden flex-col gap-3 lg:flex lg:flex-row lg:items-center">
              <BaseButton type="submit" class="sm:max-w-xs" :disabled="isSubmitting || !acceptTerms" block>
                {{ isSubmitting ? 'Confirmando…' : 'Confirmar pedido' }}
              </BaseButton>
              <NuxtLink to="/cart" class="text-center text-sm text-lumia-ink/55 underline decoration-lumia-ink/20 hover:text-lumia-ink sm:text-left">
                Volver al carrito
              </NuxtLink>
            </div>
          </form>
        </div>
      </div>

      <!-- Barra fija móvil -->
      <div
        v-if="items.length"
        class="fixed inset-x-0 bottom-0 z-40 border-t border-lumia-ink/8 bg-lumia-canvas/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_40px_-16px_rgba(15,15,15,0.15)] backdrop-blur-lg lg:hidden"
      >
        <p v-if="!acceptTerms" class="mb-2 text-center text-[11px] text-lumia-ink/50">
          Acepta los términos para confirmar
        </p>
        <div class="flex items-stretch gap-2">
          <button
            type="button"
            class="flex min-h-[48px] min-w-[4.5rem] flex-col items-center justify-center rounded-xl border border-lumia-ink/12 bg-white px-2 text-lumia-ink/70"
            aria-label="Ver pedido"
            @click="openMobileOrderSheet"
          >
            <IconShoppingBag class="h-4 w-4" stroke-width="1.35" />
            <span class="mt-0.5 text-[10px] font-semibold">{{ count }}</span>
          </button>
          <div class="flex min-w-0 flex-1 flex-col justify-center px-1">
            <p class="text-[10px] font-medium uppercase tracking-wide text-lumia-ink/45">Total estimado</p>
            <p class="font-display text-lg font-semibold tabular-nums leading-tight text-lumia-ink">
              {{ formatPrice(shippingQuote.grandTotal) }}
            </p>
          </div>
          <BaseButton
            type="submit"
            form="checkout-form"
            class="min-h-[48px] shrink-0 px-4 text-sm"
            :disabled="isSubmitting || !acceptTerms"
          >
            {{ isSubmitting ? '…' : 'Confirmar' }}
          </BaseButton>
        </div>
      </div>
    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import { IconShoppingBag } from '@tabler/icons-vue'
import { orderCheckoutShippingSchema } from '#shared/schemas/order-checkout'
import SecurityTurnstileWidget from '~/components/security/TurnstileWidget.vue'
import CheckoutMobileOrderPanel from '~/features/checkout/components/CheckoutMobileOrderPanel.vue'

const config = useRuntimeConfig()
const turnstileSiteKey = computed(() => String(config.public.turnstileSiteKey || '').trim())

const { items, count, total, clearCart, syncToServer } = useCart()
const { user, loginWithGoogle } = useAuth()
const toast = useToast()
const { quote } = useStoreShipping()
const { formatPrice } = useUtils()

const shippingQuote = computed(() => quote(total.value))

const mobileOrderPanelRef = ref<{ openSheet: () => void } | null>(null)

function openMobileOrderSheet() {
  mobileOrderPanelRef.value?.openSheet()
}

const form = reactive({
  customerName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  reference: '',
  notes: '',
})

const turnstileToken = ref<string | null>(null)
const turnstileRef = ref<InstanceType<typeof SecurityTurnstileWidget> | null>(null)

function onTurnstileToken(token: string | null) {
  turnstileToken.value = token
}

const acceptTerms = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const idempotencyKey = useState('checkout-idempotency-key', () =>
  import.meta.client ? crypto.randomUUID() : 'ssr-checkout-key'
)

watch(user, (u) => {
  if (u?.name && !form.customerName) form.customerName = u.name
}, { immediate: true })

function fieldError(name: string) {
  return fieldErrors.value[name]
}

function scrollToCheckoutIssue(fieldId?: string) {
  if (!import.meta.client) return
  nextTick(() => {
    const targetId = fieldId || (submitError.value ? 'checkout-submit-error' : '')
    const el = targetId ? document.getElementById(targetId) : null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

async function onSubmit() {
  submitError.value = ''
  fieldErrors.value = {}

  const payload = {
    ...form,
    email: user.value ? undefined : form.email.trim() || undefined,
    turnstileToken: turnstileToken.value || undefined,
  }

  const parsed = orderCheckoutShippingSchema.safeParse(payload)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string') fieldErrors.value[key] = issue.message
    }
    scrollToCheckoutIssue(Object.keys(fieldErrors.value)[0])
    return
  }

  if (!user.value && !form.email.trim()) {
    fieldErrors.value.email = 'Indica un email para recibir la confirmación.'
    scrollToCheckoutIssue('email')
    return
  }

  if (turnstileSiteKey.value && !turnstileToken.value) {
    submitError.value = 'Completa la verificación de seguridad antes de confirmar.'
    scrollToCheckoutIssue('checkout-submit-error')
    return
  }

  if (!acceptTerms.value) {
    submitError.value = 'Debes aceptar los términos para continuar.'
    scrollToCheckoutIssue('accept-terms')
    return
  }

  isSubmitting.value = true
  try {
    if (!user.value) {
      const synced = await syncToServer()
      if (!synced) {
        submitError.value = 'No se pudo sincronizar tu carrito. Revisa tu conexión e inténtalo de nuevo.'
        toast.error(submitError.value)
        scrollToCheckoutIssue('checkout-submit-error')
        return
      }
    }

    const result = await $fetch<{
      orderNumber: string
      total: number
      paymentStatus: string
      accessToken: string
    }>('/api/orders/create', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey.value },
      body: parsed.data,
      timeout: 50_000,
    })

    await clearCart()
    idempotencyKey.value = crypto.randomUUID()
    toast.success('Pedido registrado')
    await navigateTo({
      path: '/thank-you',
      query: { token: result.accessToken },
    })
  } catch (e: unknown) {
    const err = e as {
      statusCode?: number
      data?: { message?: string; statusMessage?: string }
      message?: string
      statusMessage?: string
    }
    submitError.value =
      err?.data?.message ||
      err?.data?.statusMessage ||
      err?.message ||
      err?.statusMessage ||
      'No se pudo crear el pedido'
    toast.error(submitError.value)
    turnstileRef.value?.reset()
    scrollToCheckoutIssue('checkout-submit-error')
  } finally {
    isSubmitting.value = false
  }
}

useHead({
  title: 'Checkout — LUMIA',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
