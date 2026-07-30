<template>
  <div class="bg-lumia-canvas pb-24 pt-6 md:pt-10">
    <BaseContainer>
      <AppBreadcrumbs :items="[{ label: 'Inicio', to: '/' }, { label: 'Carrito', to: '/cart' }, { label: 'Checkout' }]" />

      <h1 class="mt-8 font-display text-4xl font-medium text-lumia-ink md:text-5xl">Checkout</h1>
      <p class="mt-4 max-w-2xl text-lumia-ink/65">
        Completa tus datos de envío. El pago se coordina directamente con el vendedor (transferencia, efectivo, etc.).
      </p>

      <div v-if="!items.length" class="mt-12 rounded-2xl border border-dashed border-lumia-ink/15 bg-lumia-cream/40 p-10 text-center">
        <p class="text-lumia-ink/70">Tu carrito está vacío.</p>
        <BaseButton to="/products" class="mt-6">Ir al catálogo</BaseButton>
      </div>

      <div v-else class="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div class="rounded-2xl border border-lumia-ink/8 bg-white p-6 shadow-soft md:p-8">
          <div class="mb-8 flex flex-col gap-4 rounded-2xl border border-lumia-ink/10 bg-lumia-cream/35 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-lumia-ink/45">Identificación</p>
              <p v-if="user" class="mt-2 text-sm text-lumia-ink/65">Sesión activa: el pedido quedará vinculado a tu cuenta.</p>
              <p v-else class="mt-2 text-sm text-lumia-ink/65">Puedes entrar con Google o comprar como invitado.</p>
            </div>
            <GoogleSignInButton v-if="!user" class="shrink-0 sm:min-w-[240px]" @click="loginWithGoogle('/checkout')" />
          </div>

          <form @submit.prevent="onSubmit">
            <h2 class="font-display text-xl text-lumia-ink">Datos de envío</h2>
            <p class="mt-1 text-sm text-lumia-ink/55">Los usaremos solo para este pedido.</p>

            <div class="mt-6 grid gap-5 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="customerName">Nombre completo</label>
                <input id="customerName" v-model="form.customerName" type="text" autocomplete="name" class="lumia-field-input" :class="fieldError('customerName') && 'border-rose-400'" />
                <p v-if="fieldError('customerName')" class="mt-1 text-xs text-rose-600">{{ fieldError('customerName') }}</p>
              </div>

              <div v-if="!user" class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="email">Email</label>
                <input id="email" v-model="form.email" type="email" autocomplete="email" placeholder="tu@email.com" class="lumia-field-input" :class="fieldError('email') && 'border-rose-400'" />
                <p v-if="fieldError('email')" class="mt-1 text-xs text-rose-600">{{ fieldError('email') }}</p>
                <p v-else class="mt-1 text-xs text-lumia-ink/50">Te enviaremos la confirmación del pedido.</p>
              </div>
              <p v-else-if="user?.email" class="sm:col-span-2 text-sm text-lumia-ink/60">
                Confirmación a <span class="font-medium text-lumia-ink">{{ user.email }}</span>
              </p>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="phone">Teléfono / WhatsApp</label>
                <input id="phone" v-model="form.phone" type="tel" autocomplete="tel" placeholder="Ej. +57 300 1234567" class="lumia-field-input" :class="fieldError('phone') && 'border-rose-400'" />
                <p v-if="fieldError('phone')" class="mt-1 text-xs text-rose-600">{{ fieldError('phone') }}</p>
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="address">Dirección</label>
                <input id="address" v-model="form.address" type="text" autocomplete="street-address" class="lumia-field-input" :class="fieldError('address') && 'border-rose-400'" />
                <p v-if="fieldError('address')" class="mt-1 text-xs text-rose-600">{{ fieldError('address') }}</p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="city">Ciudad</label>
                <input id="city" v-model="form.city" type="text" autocomplete="address-level2" class="lumia-field-input" :class="fieldError('city') && 'border-rose-400'" />
                <p v-if="fieldError('city')" class="mt-1 text-xs text-rose-600">{{ fieldError('city') }}</p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="reference">Referencia</label>
                <input id="reference" v-model="form.reference" type="text" placeholder="Torre, apto, barrio…" class="lumia-field-input" :class="fieldError('reference') && 'border-rose-400'" />
                <p v-if="fieldError('reference')" class="mt-1 text-xs text-rose-600">{{ fieldError('reference') }}</p>
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="notes">Notas (opcional)</label>
                <textarea id="notes" v-model="form.notes" rows="3" class="field-input resize-y" />
              </div>
            </div>

            <div class="mt-6 rounded-xl border border-lumia-gold/20 bg-lumia-gold/5 p-4">
              <p class="text-sm font-medium text-lumia-ink">Pago acordado con el vendedor</p>
              <p class="mt-1 text-xs leading-relaxed text-lumia-ink/60">
                Al confirmar, registramos tu pedido y te contactamos para acordar transferencia, efectivo u otro método.
              </p>
            </div>

            <div class="mt-6 flex items-start gap-3">
              <input id="accept-terms" v-model="acceptTerms" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-lumia-ink/20" />
              <label for="accept-terms" class="text-xs leading-relaxed text-lumia-ink/60">
                Acepto los
                <NuxtLink to="/legal/terms" class="font-medium text-lumia-gold underline">Términos</NuxtLink>
                y la
                <NuxtLink to="/legal/privacy" class="font-medium text-lumia-gold underline">Política de Privacidad</NuxtLink>.
              </label>
            </div>

            <SecurityTurnstileWidget
              v-if="turnstileSiteKey"
              ref="turnstileRef"
              :site-key="turnstileSiteKey"
              class="mt-6"
              @token="onTurnstileToken"
            />

            <p v-if="submitError" class="mt-4 text-sm text-rose-600">{{ submitError }}</p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <BaseButton type="submit" class="sm:max-w-xs" :disabled="isSubmitting || !acceptTerms" block>
                {{ isSubmitting ? 'Confirmando…' : 'Confirmar pedido' }}
              </BaseButton>
              <NuxtLink to="/cart" class="text-center text-sm text-lumia-ink/55 underline decoration-lumia-ink/20 hover:text-lumia-ink sm:text-left">
                Volver al carrito
              </NuxtLink>
            </div>
          </form>
        </div>

        <CheckoutOrderSummary
          :items="items"
          :count="count"
          :subtotal="total"
          :shipping-cost="shippingQuote.shippingCost"
          :grand-total="shippingQuote.grandTotal"
          :shipping-variable="shippingQuote.variable"
          :free-shipping="shippingQuote.freeShipping"
        />
      </div>
    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import { orderCheckoutShippingSchema } from '#shared/schemas/order-checkout'
import SecurityTurnstileWidget from '~/components/security/TurnstileWidget.vue'

const config = useRuntimeConfig()
const turnstileSiteKey = computed(() => String(config.public.turnstileSiteKey || '').trim())

const { items, count, total, clearCart } = useCart()
const { user, loginWithGoogle } = useAuth()
const toast = useToast()
const { quote } = useStoreShipping()

const shippingQuote = computed(() => quote(total.value))

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
    return
  }

  if (!user.value && !form.email.trim()) {
    fieldErrors.value.email = 'Indica un email para recibir la confirmación.'
    return
  }

  if (turnstileSiteKey.value && !turnstileToken.value) {
    submitError.value = 'Completa la verificación de seguridad antes de confirmar.'
    return
  }

  if (!acceptTerms.value) {
    submitError.value = 'Debes aceptar los términos para continuar.'
    return
  }

  isSubmitting.value = true
  try {
    const fetchOpts = {
      method: 'POST' as const,
      headers: { 'Idempotency-Key': idempotencyKey.value },
      body: parsed.data,
      timeout: 45_000,
    }

    let result: {
      orderNumber: string
      total: number
      paymentStatus: string
      accessToken: string
    }

    try {
      result = await $fetch('/api/orders/create', fetchOpts)
    } catch (firstError: unknown) {
      const status = (firstError as { statusCode?: number })?.statusCode
      if (status !== 503) throw firstError
      await new Promise((resolve) => setTimeout(resolve, 1500))
      result = await $fetch('/api/orders/create', fetchOpts)
    }

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
      data?: { message?: string }
      message?: string
      statusMessage?: string
    }
    submitError.value =
      err?.data?.message ||
      err?.message ||
      err?.statusMessage ||
      'No se pudo crear el pedido'
    toast.error(submitError.value)
    turnstileRef.value?.reset()
  } finally {
    isSubmitting.value = false
  }
}

useHead({
  title: 'Checkout — LUMIA',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
