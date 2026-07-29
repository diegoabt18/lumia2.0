<template>
  <section class="border-t border-lumia-ink/6 bg-lumia-cream/60 py-16 md:py-20">
    <BaseContainer>
      <div class="mx-auto max-w-xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-lumia-ink/45">Newsletter</p>
        <h2 class="mt-4 font-display text-3xl text-lumia-ink">Lanzamientos y ritual mensual</h2>
        <p class="mt-4 text-sm text-lumia-ink/60">
          Ediciones limitadas y notas de cuidado. Sin saturar tu bandeja.
        </p>
        <form class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center" @submit.prevent="onSubmit">
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
  </section>
</template>

<script setup lang="ts">
const email = ref('')
const pending = ref(false)
const message = ref('')
const ok = ref(false)
const toast = useToast()

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
