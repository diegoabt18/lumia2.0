<script setup lang="ts">
/**
 * Imagen de tienda: consume CDN vía LumiaImage. Sin procesamiento.
 */
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    src: string
    alt: string
    sizes?: string
    width?: number | string
    height?: number | string
    srcset?: string
    webpSrcset?: string
    loading?: 'lazy' | 'eager'
    fetchpriority?: 'high' | 'low' | 'auto'
  }>(),
  {
    loading: 'lazy',
    fetchpriority: 'auto',
  }
)

const attrs = useAttrs()

const mergedImgClass = computed(() => {
  const extra = (attrs as { class?: unknown }).class
  const base =
    'absolute inset-0 block h-full w-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none'
  if (!extra) return base
  if (typeof extra === 'string') return `${base} ${extra}`
  return base
})
</script>

<template>
  <div class="relative h-full min-h-[4rem] w-full overflow-hidden bg-gradient-to-br from-lumia-beige/50 via-lumia-cream/40 to-lumia-beige/35">
    <LumiaImage
      :src="src"
      :alt="alt"
      :sizes="sizes"
      :width="width"
      :height="height"
      :srcset="srcset"
      :webp-srcset="webpSrcset"
      :loading="loading"
      :fetchpriority="fetchpriority"
      :img-class="mergedImgClass"
    />
  </div>
</template>
