<script setup lang="ts">
/**
 * Consumidor CDN (LUMIA 2.0): AVIF + WebP, srcset, lazy, dimensiones.
 * NO procesa imágenes — cero sharp/libvips/IPX.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    srcset?: string
    webpSrcset?: string
    sizes?: string
    width?: number | string
    height?: number | string
    loading?: 'lazy' | 'eager'
    fetchpriority?: 'high' | 'low' | 'auto'
    decoding?: 'async' | 'auto' | 'sync'
    imgClass?: string
  }>(),
  {
    loading: 'lazy',
    fetchpriority: 'auto',
    decoding: 'async',
  }
)

const attrs = useAttrs()
const failed = ref(false)

watch(
  () => props.src,
  () => {
    failed.value = false
  }
)

function onImgError() {
  failed.value = true
}

function toWebp(url: string): string {
  return url.replace(/\.avif(\?.*)?$/i, '.webp$1')
}

const avifSrcset = computed(() => props.srcset?.trim() || undefined)
const webpSrcset = computed(() => {
  if (props.webpSrcset?.trim()) return props.webpSrcset.trim()
  if (props.srcset?.trim()) {
    return props.srcset.replace(/\.avif(\?|#|\s|$)/gi, '.webp$1')
  }
  if (/\.avif(\?|$)/i.test(props.src)) return toWebp(props.src)
  return undefined
})

const webpSrc = computed(() => {
  if (/\.avif(\?|$)/i.test(props.src)) return toWebp(props.src)
  return undefined
})

const imgFallbackSrc = computed(() => webpSrc.value || props.src)

const mergedImgClass = computed(() => {
  const extra = (attrs as { class?: unknown }).class
  if (!props.imgClass && !extra) return undefined
  if (!extra) return props.imgClass
  if (!props.imgClass) return extra
  if (typeof extra === 'string') return `${props.imgClass} ${extra}`
  return [props.imgClass, extra]
})

const passthroughAttrs = computed(() => {
  const raw = attrs as Record<string, unknown>
  const { class: _drop, ...rest } = raw
  return rest
})
</script>

<template>
  <template v-if="!failed && src.trim()">
    <picture>
      <source
        v-if="avifSrcset || /\.avif(\?|$)/i.test(src)"
        type="image/avif"
        :srcset="avifSrcset || src"
        :sizes="sizes"
      />
      <source
        v-if="webpSrcset || webpSrc"
        type="image/webp"
        :srcset="webpSrcset || webpSrc"
        :sizes="sizes"
      />
      <img
        v-bind="passthroughAttrs"
        :class="mergedImgClass"
        :src="imgFallbackSrc"
        :alt="alt"
        :width="width"
        :height="height"
        :sizes="sizes"
        :srcset="webpSrcset || avifSrcset"
        :loading="loading"
        :fetchpriority="fetchpriority"
        :decoding="decoding"
        @error="onImgError"
      />
    </picture>
  </template>
  <div
    v-else
    class="flex h-full min-h-[4rem] w-full items-center justify-center bg-gradient-to-br from-lumia-beige/75 to-lumia-cream/65 px-3 text-center"
    role="img"
    :aria-label="alt"
  >
    <span class="font-display text-[11px] font-medium uppercase tracking-[0.35em] text-lumia-ink/30">LUMIA</span>
  </div>
</template>
