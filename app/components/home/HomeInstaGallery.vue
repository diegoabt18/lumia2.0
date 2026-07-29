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
          v-for="(src, i) in displaySlots"
          :key="src ? `${src}-${i}` : `placeholder-${i}`"
          class="aspect-square overflow-hidden rounded-lg bg-lumia-beige/60"
        >
          <NuxtImg
            v-if="src"
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
import { discoverMomentsGalleryImages } from '~/composables/useHomeHeroImages'

const config = useRuntimeConfig()
const cdnBase =
  (typeof config.public.productImagesCdnBase === 'string' && config.public.productImagesCdnBase.trim()) || ''
const maxImages = Math.min(24, Math.max(1, Number(config.public.homeMomentsMaxImages) || 12))

const { data: galleryImages } = useAsyncData(
  'home-moments-gallery',
  () => discoverMomentsGalleryImages(cdnBase, maxImages),
  { server: false, lazy: true, default: () => [] as string[] }
)

const images = computed(() => galleryImages.value ?? [])

const PLACEHOLDER_COUNT = 6

const displaySlots = computed(() => {
  if (images.value.length) return images.value
  return Array.from({ length: PLACEHOLDER_COUNT }, () => null as string | null)
})
</script>
