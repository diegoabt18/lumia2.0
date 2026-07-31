<template>
  <section class="bg-lumia-canvas py-10 md:py-24">
    <BaseContainer>
      <div class="mx-auto max-w-2xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">Testimonios</p>
        <h2 class="mt-2 font-display text-2xl font-medium text-lumia-ink sm:mt-3 sm:text-3xl md:text-4xl">
          Historias en casa
        </h2>
      </div>

      <!-- Móvil: carrusel horizontal -->
      <div
        class="-mx-4 mt-8 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden md:mx-0 md:mt-12 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0"
      >
        <figure
          v-for="(t, i) in quotes"
          :key="i"
          class="flex w-[min(88vw,320px)] shrink-0 snap-center flex-col rounded-2xl border border-lumia-ink/6 bg-lumia-cream/50 p-6 shadow-soft md:w-auto"
        >
          <blockquote class="flex-1 text-sm leading-relaxed text-lumia-ink/75">“{{ t.text }}”</blockquote>
          <figcaption class="mt-5 border-t border-lumia-ink/8 pt-5 md:mt-6 md:pt-6">
            <p class="font-medium text-lumia-ink">{{ t.name }}</p>
            <p class="text-xs text-lumia-ink/50">{{ t.role }}</p>
          </figcaption>
        </figure>
      </div>
    </BaseContainer>
  </section>
</template>

<script setup lang="ts">
const quotes = [
  { text: 'El aroma permanece sin ser invasivo. Parece un objeto de diseño, no solo una vela.', name: 'Laura M.', role: 'Bogotá' },
  { text: 'Regalé el set premium y quedó espectacular. El packaging ya cuenta una historia.', name: 'Daniel R.', role: 'Medellín' },
  { text: 'La de cemento ilumina mi salón con una calma que no esperaba.', name: 'Elena V.', role: 'Cali' },
]
</script>
