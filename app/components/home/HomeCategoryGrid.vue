<template>
  <section id="colecciones" class="scroll-mt-24 bg-lumia-beige/35 py-16 md:py-24">
    <BaseContainer>
      <div class="mx-auto max-w-2xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">Colecciones</p>
        <h2 class="mt-3 font-display text-3xl font-medium text-lumia-ink md:text-4xl">Explora por atmósfera</h2>
      </div>
      <div class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          v-for="cat in categories"
          :key="cat.label"
          to="/products"
          class="group relative overflow-hidden rounded-2xl bg-lumia-canvas shadow-soft transition-all duration-200 hover:scale-[1.02] hover:shadow-soft-lg"
        >
          <div class="aspect-[4/5] overflow-hidden bg-lumia-beige/60">
            <NuxtImg
              :src="cat.image"
              :alt="cat.label"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              sizes="(max-width: 640px) 100vw, 25vw"
            />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-lumia-ink/70 via-lumia-ink/10 to-transparent" />
          <div class="absolute bottom-0 left-0 right-0 p-6">
            <p class="font-display text-xl text-lumia-cream">{{ cat.label }}</p>
            <p class="mt-1 text-xs text-lumia-cream/75">{{ cat.sub }}</p>
          </div>
        </NuxtLink>
      </div>
    </BaseContainer>
  </section>
</template>

<script setup lang="ts">
const categories = [
  {
    label: 'Aromáticas',
    sub: 'Notas que envuelven',
    image: 'https://images.unsplash.com/photo-1603006905004-6f2b1d3b0b0b?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Decorativas',
    sub: 'Objeto y luz',
    image: 'https://images.unsplash.com/photo-1612196808214-b7e239e5bbae?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Premium',
    sub: 'Edición limitada',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Sets de regalo',
    sub: 'Para regalar',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238be345a?auto=format&fit=crop&w=800&q=80',
  },
]
</script>
