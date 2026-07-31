<template>
  <section v-if="banners.length" class="border-b border-lumia-ink/6 bg-lumia-canvas py-4 sm:py-6">
    <BaseContainer>
      <div class="grid gap-3 sm:gap-4 md:grid-cols-2">
        <NuxtLink
          v-for="banner in banners"
          :key="banner.id"
          :to="banner.href"
          class="group relative overflow-hidden rounded-2xl border border-lumia-ink/8 bg-lumia-beige/30 shadow-soft"
        >
          <NuxtImg
            :src="banner.imageUrl"
            :alt="banner.title ?? 'Promoción LUMIA'"
            class="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.02] sm:aspect-[21/9]"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div
            v-if="banner.title || banner.subtitle"
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-lumia-ink/75 to-transparent p-4 text-white"
          >
            <p v-if="banner.title" class="font-display text-lg">{{ banner.title }}</p>
            <p v-if="banner.subtitle" class="mt-1 text-sm text-white/85">{{ banner.subtitle }}</p>
            <span v-if="banner.ctaLabel" class="mt-2 inline-block text-xs font-semibold uppercase tracking-wide">
              {{ banner.ctaLabel }} →
            </span>
          </div>
        </NuxtLink>
      </div>
    </BaseContainer>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ position?: string }>(), { position: 'homepage_secondary' })

const { bannersFor } = useStoreSettings()
const banners = bannersFor(props.position)
</script>
