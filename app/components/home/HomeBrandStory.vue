<template>
  <section id="historia" class="scroll-mt-24 py-10 md:py-24">
    <BaseContainer>
      <div class="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <div class="relative aspect-[5/4] overflow-hidden rounded-2xl bg-lumia-beige/50 shadow-soft sm:aspect-[4/5] lg:aspect-auto lg:min-h-[32rem]">
          <NuxtImg
            v-if="historyImage"
            :src="historyImage"
            alt="Artesanía LUMIA"
            class="h-full w-full object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">Nuestra historia</p>
          <h2 class="mt-3 font-display text-2xl font-medium leading-tight text-lumia-ink sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl">
            Hecho a mano con pasión
          </h2>
          <p class="mt-4 text-sm leading-relaxed text-lumia-ink/70 sm:mt-6 sm:text-base md:text-lg">
            Cada pieza nace en un taller pequeño, con procesos lentos y materiales elegidos con mimo. No
            fabricamos en serie: ritualizamos el oficio para que la luz y el aroma te acompañen años.
          </p>
          <p class="mt-3 text-sm leading-relaxed text-lumia-ink/70 sm:mt-4 sm:text-base md:text-lg">
            LUMIA es decoración con alma: objetos que abrazan el silencio de una tarde de domingo o la mesa
            de una cena que quieres recordar.
          </p>
          <BaseButton to="/products" variant="secondary" block class="mt-8 sm:mt-10 sm:!w-auto">
            Descubrir la colección
          </BaseButton>
        </div>
      </div>
    </BaseContainer>
  </section>
</template>

<script setup lang="ts">
import { discoverBrandHistoryImage } from '~/composables/useHomeHeroImages'

const config = useRuntimeConfig()
const cdnBase =
  (typeof config.public.productImagesCdnBase === 'string' && config.public.productImagesCdnBase.trim()) || ''

const { data: historyImage } = useAsyncData(
  'home-brand-history-image',
  () => discoverBrandHistoryImage(cdnBase),
  { server: false, lazy: true, default: () => null as string | null }
)
</script>
