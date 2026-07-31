<template>
  <button
    type="button"
    class="flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-lumia-canvas/90 text-lumia-ink shadow-sm backdrop-blur-sm transition hover:scale-105 disabled:opacity-50"
    :class="favorited ? 'text-rose-500' : 'text-lumia-ink/70'"
    :disabled="pending"
    :aria-label="favorited ? 'Quitar de favoritos' : 'Añadir a favoritos'"
    @click.stop="onToggle"
  >
    <IconLoader2 v-if="pending" class="h-4 w-4 animate-spin" />
    <IconHeart v-else class="h-4 w-4" :class="favorited ? 'fill-current' : ''" stroke-width="1.35" />
  </button>
</template>

<script setup lang="ts">
import { IconHeart, IconLoader2 } from '@tabler/icons-vue'
const props = defineProps<{ productSlug: string }>()

const { favorited, pending, toggle } = useProductWishlist(() => props.productSlug)
const toast = useToast()

async function onToggle() {
  const result = await toggle()
  if (result === true) toast.success('Añadido a favoritos')
  else if (result === false) toast.info('Eliminado de favoritos')
}
</script>
