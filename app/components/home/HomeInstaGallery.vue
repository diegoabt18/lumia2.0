<template>
  <section class="bg-lumia-beige/25 py-10 md:py-16">
    <BaseContainer>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">@lumia.home</p>
          <h2 class="mt-1.5 font-display text-xl text-lumia-ink sm:mt-2 sm:text-2xl md:text-3xl">Momentos reales</h2>
        </div>
        <span class="text-xs text-lumia-ink/50 sm:text-sm">Inspiración y estilo de vida</span>
      </div>
      <div class="mt-6 grid grid-cols-3 gap-1.5 sm:mt-8 sm:grid-cols-3 sm:gap-2 md:gap-3 lg:grid-cols-6">
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
