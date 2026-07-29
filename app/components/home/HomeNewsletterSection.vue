<template>
  <section class="border-t border-lumia-ink/6 bg-lumia-cream/60 py-16 md:py-20">
    <BaseContainer>
      <div class="mx-auto max-w-xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-lumia-ink/45">Newsletter</p>
        <h2 class="mt-4 font-display text-3xl text-lumia-ink">Lanzamientos y ritual mensual</h2>
        <p class="mt-4 text-sm text-lumia-ink/60">
          Ediciones limitadas y notas de cuidado. Sin saturar tu bandeja.
        </p>
        <form class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center" @submit.prevent>
          <input
            type="email"
            required
            placeholder="tu@email.com"
            class="min-h-12 flex-1 rounded-xl border border-lumia-ink/10 bg-lumia-canvas px-5 text-sm text-lumia-ink placeholder:text-lumia-ink/35 focus:border-lumia-gold/45 focus:outline-none"
          />
          <BaseButton type="submit" variant="primary" class="shrink-0">Suscribirme</BaseButton>
        </form>
      </div>
    </BaseContainer>
  </section>
</template>
