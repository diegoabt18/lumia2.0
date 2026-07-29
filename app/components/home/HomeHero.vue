<template>
  <section
    class="relative min-h-[72dvh] overflow-hidden bg-lumia-beige/50 md:min-h-[85vh]"
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
  >
    <div v-if="slides.length" class="absolute inset-0" aria-hidden="true">
      <template v-if="slides.length === 1">
        <NuxtImg
          :src="slides[0]"
          alt=""
          class="h-full w-full object-cover"
          loading="eager"
          fetchpriority="high"
          sizes="100vw"
        />
      </template>

      <template v-else>
        <div
          v-for="(src, index) in slides"
          :key="src"
          class="hero-slide absolute inset-0"
          :class="{ 'hero-slide--active': index === activeIndex }"
        >
          <NuxtImg
            :src="src"
            alt=""
            class="hero-slide__img h-full w-full object-cover"
            :loading="index === 0 ? 'eager' : 'lazy'"
            :fetchpriority="index === 0 ? 'high' : 'auto'"
            sizes="100vw"
          />
        </div>
      </template>
    </div>

    <div class="absolute inset-0 bg-gradient-to-r from-lumia-canvas/95 via-lumia-canvas/75 to-lumia-canvas/20" />

    <div
      v-if="slides.length > 1"
      class="absolute bottom-6 right-4 z-10 flex gap-2 md:bottom-8 md:right-8"
      aria-label="Diapositivas del hero"
    >
      <button
        v-for="(_, index) in slides"
        :key="`dot-${index}`"
        type="button"
        class="h-2 rounded-full transition-all duration-500"
        :class="index === activeIndex ? 'w-6 bg-white/95' : 'w-2 bg-white/45 hover:bg-white/70'"
        :aria-label="`Ir a imagen ${index + 1}`"
        :aria-current="index === activeIndex ? 'true' : undefined"
        @click="goTo(index)"
      />
    </div>

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
import { discoverHomeHeroSlides } from '~/composables/useHomeHeroImages'

const config = useRuntimeConfig()
const cdnBase =
  (typeof config.public.productImagesCdnBase === 'string' && config.public.productImagesCdnBase.trim()) || ''
const maxSlides = Math.min(12, Math.max(1, Number(config.public.homeHeroMaxSlides) || 8))
const intervalMs = Math.max(3000, Number(config.public.homeHeroSlideIntervalMs) || 5500)

const { data: slideData } = useAsyncData('home-hero-slides', () => discoverHomeHeroSlides(cdnBase, maxSlides), {
  server: false,
  lazy: true,
  default: () => [] as string[],
})

const slides = computed(() => slideData.value ?? [])
const activeIndex = ref(0)
const prefersReducedMotion = usePreferredReducedMotion()

let timer: ReturnType<typeof setInterval> | null = null

function goTo(index: number) {
  if (!slides.value.length) return
  activeIndex.value = ((index % slides.value.length) + slides.value.length) % slides.value.length
}

function nextSlide() {
  goTo(activeIndex.value + 1)
}

function startAutoplay() {
  stopAutoplay()
  if (!import.meta.client || slides.value.length <= 1) return
  if (prefersReducedMotion.value === 'reduce') return

  timer = setInterval(nextSlide, intervalMs)
}

function stopAutoplay() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)

watch(slides, () => {
  activeIndex.value = 0
  startAutoplay()
})

watch(prefersReducedMotion, (value) => {
  if (value === 'reduce') stopAutoplay()
  else startAutoplay()
})

function scrollToCollections() {
  document.getElementById('colecciones')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped>
.hero-slide {
  opacity: 0;
  transition: opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity;
}

.hero-slide--active {
  opacity: 1;
}

.hero-slide__img {
  transform: scale(1.04);
  transition: transform 8s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.hero-slide--active .hero-slide__img {
  transform: scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .hero-slide,
  .hero-slide__img {
    transition: none;
  }

  .hero-slide__img {
    transform: none;
  }
}
</style>
