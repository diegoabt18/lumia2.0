<script setup lang="ts">
/**
 * Miniatura de producto reutilizable.
 * - Resuelve la URL con el mismo resolutor CDN que la tienda (nunca usa rutas crudas).
 * - Si no hay imagen, la referencia falla o el CDN responde error, muestra el logo oficial de Lumia.
 * - Si el propio logo falla, muestra un bloque neutro. No hay bucle de errores.
 */
import { buildFolderImageUrl } from '#shared/cdn-images/numbered-images'

const props = withDefaults(
  defineProps<{
    slug: string
    imagePath?: string | null
    alt: string
    /** Tamaño visual en píxeles; la imagen se recorta sin deformarse. */
    size?: number
  }>(),
  { imagePath: null, size: 48 },
)

const { resolveProductImageSrc, PRODUCT_IMAGE_SIZE_THUMB } = useProductImages()
const { imageCdnUrl } = useImageCdn()

const productFailed = ref(false)
const logoFailed = ref(false)

const productSrc = computed(() => {
  if (!props.slug) return ''
  return resolveProductImageSrc(props.slug, props.imagePath ?? '', PRODUCT_IMAGE_SIZE_THUMB)
})
const logoSrc = computed(() => buildFolderImageUrl(imageCdnUrl, 'main_logo', 'logo.avif'))

const showProduct = computed(() => !productFailed.value && productSrc.value.length > 0)

watch(
  () => [props.slug, props.imagePath],
  () => {
    productFailed.value = false
    logoFailed.value = false
  },
)
</script>

<template>
  <div
    class="relative shrink-0 overflow-hidden rounded-lg border border-lumia-ink/8 bg-lumia-cream/40"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <img
      v-if="showProduct"
      :src="productSrc"
      :alt="alt"
      loading="lazy"
      decoding="async"
      class="h-full w-full object-contain"
      @error="productFailed = true"
    />
    <img
      v-else-if="!logoFailed"
      :src="logoSrc"
      alt="Lumia"
      loading="lazy"
      decoding="async"
      class="h-full w-full object-contain p-2"
      @error="logoFailed = true"
    />
    <div
      v-else
      class="flex h-full w-full items-center justify-center font-display text-[9px] uppercase tracking-[0.2em] text-lumia-ink/30"
      role="img"
      :aria-label="alt"
    >
      Lumia
    </div>
  </div>
</template>
