<template>
  <section class="border-t border-lumia-ink/6 bg-lumia-cream/60 py-10 md:py-20">
    <BaseContainer>
      <div class="mx-auto max-w-xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-lumia-ink/45">Newsletter</p>
        <h2 class="mt-3 font-display text-2xl text-lumia-ink sm:mt-4 sm:text-3xl">Lanzamientos y ritual mensual</h2>
        <p class="mt-4 text-sm text-lumia-ink/60">
          Ediciones limitadas, promociones y notas de cuidado. Sin saturar tu bandeja.
        </p>

        <!-- Con sesión: suscripción en un clic, con confirmación y cancelación desde Mi cuenta -->
        <div v-if="user" class="mt-8">
          <p v-if="subscribed" class="text-sm text-emerald-700">
            Ya estás suscrito. Puedes cancelarlo en cualquier momento desde
            <NuxtLink to="/account" class="font-semibold underline underline-offset-2">Mi cuenta</NuxtLink>.
          </p>
          <BaseButton v-else type="button" variant="primary" @click="confirmOpen = true">Suscribirme</BaseButton>
        </div>

        <!-- Sin sesión: correo como antes -->
        <form v-else class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center" @submit.prevent="onSubmit">
          <input
            v-model="email"
            type="email"
            required
            placeholder="tu@email.com"
            class="min-h-12 flex-1 rounded-xl border border-lumia-ink/10 bg-lumia-canvas px-5 text-sm text-lumia-ink placeholder:text-lumia-ink/35 focus:border-lumia-gold/45 focus:outline-none"
          />
          <BaseButton type="submit" variant="primary" class="shrink-0" :disabled="pending">
            {{ pending ? 'Enviando…' : 'Suscribirme' }}
          </BaseButton>
        </form>
        <p v-if="message" class="mt-4 text-sm" :class="ok ? 'text-emerald-700' : 'text-rose-600'">{{ message }}</p>
      </div>
    </BaseContainer>

    <ConfirmDialog
      :open="confirmOpen"
      title="Confirma tu suscripción"
      confirm-label="Confirmar suscripción"
      :pending="subscribing"
      @cancel="confirmOpen = false"
      @confirm="confirmSubscribe"
    >
      <p>
        Recibirás lanzamientos, promociones y anuncios en <strong class="text-lumia-ink">{{ user?.email }}</strong>.
      </p>
      <p>
        Puedes cancelar la suscripción en cualquier momento desde <strong class="text-lumia-ink">Mi cuenta</strong>,
        en la sección Newsletter.
      </p>
    </ConfirmDialog>
  </section>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { subscribed, setSubscribed } = useNewsletter()

const email = ref('')
const pending = ref(false)
const message = ref('')
const ok = ref(false)
const toast = useToast()

const confirmOpen = ref(false)
const subscribing = ref(false)

async function confirmSubscribe() {
  subscribing.value = true
  try {
    await setSubscribed(true)
    confirmOpen.value = false
    toast.success('Suscripción activada')
  } catch {
    toast.error('No se pudo activar la suscripción. Intenta de nuevo.')
  } finally {
    subscribing.value = false
  }
}

async function onSubmit() {
  message.value = ''
  pending.value = true
  try {
    await $fetch('/api/newsletter/subscribe', {
      method: 'POST',
      body: { email: email.value.trim() },
    })
    ok.value = true
    message.value = '¡Listo! Revisa tu correo para confirmar.'
    toast.success('Suscripción registrada')
    email.value = ''
  } catch (e: unknown) {
    ok.value = false
    const err = e as { data?: { message?: string }; message?: string }
    message.value = err?.data?.message || err?.message || 'No se pudo completar la suscripción.'
  } finally {
    pending.value = false
  }
}
</script>
