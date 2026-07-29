<template>
  <section class="relative min-h-[72dvh] overflow-hidden bg-lumia-beige/50 md:min-h-[85vh]">
    <NuxtImg
      src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=2000&q=80"
      alt=""
      class="absolute inset-0 h-full w-full object-cover"
      loading="eager"
      sizes="100vw"
    />
    <div class="absolute inset-0 bg-gradient-to-r from-lumia-canvas/95 via-lumia-canvas/75 to-lumia-canvas/20" />
    <BaseContainer class="relative flex min-h-[72dvh] flex-col justify-end pb-16 pt-28 md:min-h-[85vh] md:pb-24 md:pt-32">
      <div class="max-w-2xl">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-lumia-ink/50">Nueva temporada</p>
        <h1 class="mt-4 font-display text-4xl font-medium leading-[1.1] text-lumia-ink sm:text-5xl md:text-6xl lg:text-7xl">
          Transforma momentos en experiencias
        </h1>
        <p class="mt-6 max-w-md text-base leading-relaxed text-lumia-ink/70 md:text-lg">
          Velas artesanales, luz cálida y aromas que convierten tu hogar en un refugio.
        </p>
        <div class="mt-10 flex flex-wrap gap-4">
          <BaseButton type="button" variant="primary" @click="scrollToCollections">
            Explorar colecciones
          </BaseButton>
          <BaseButton to="/products" variant="secondary">Ver velas</BaseButton>
        </div>
      </div>
    </BaseContainer>
  </section>
</template>

<script setup lang="ts">
function scrollToCollections() {
  document.getElementById('colecciones')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>
