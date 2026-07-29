<template>
  <section class="bg-lumia-beige/25 py-12 md:py-16">
    <BaseContainer>
      <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">@lumia.home</p>
          <h2 class="mt-2 font-display text-2xl text-lumia-ink md:text-3xl">Momentos reales</h2>
        </div>
        <span class="text-sm text-lumia-ink/50">Inspiración y estilo de vida · comunidad</span>
      </div>
      <div class="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-6">
        <div
          v-for="(src, i) in images"
          :key="i"
          class="aspect-square overflow-hidden rounded-lg bg-lumia-beige/60"
        >
          <NuxtImg
            :src="src"
            alt=""
            class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            sizes="(max-width: 768px) 50vw, 16vw"
          />
        </div>
      </div>
    </BaseContainer>
  </section>
</template>

<script setup lang="ts">
const images = [
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1612196808214-b7e239e5bbae?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1513885535751-8b9238be345a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1603006905004-6f2b1d3b0b0b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80',
]
</script>
