<template>
  <section class="bg-lumia-canvas py-16 md:py-24">
    <BaseContainer>
      <div class="mx-auto max-w-2xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">Testimonios</p>
        <h2 class="mt-3 font-display text-3xl font-medium text-lumia-ink md:text-4xl">Historias en casa</h2>
      </div>
      <div class="mt-12 grid gap-8 md:grid-cols-3">
        <figure
          v-for="(t, i) in quotes"
          :key="i"
          class="flex flex-col rounded-2xl border border-lumia-ink/6 bg-lumia-cream/50 p-8 shadow-soft"
        >
          <blockquote class="flex-1 text-sm leading-relaxed text-lumia-ink/75">“{{ t.text }}”</blockquote>
          <figcaption class="mt-6 border-t border-lumia-ink/8 pt-6">
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
