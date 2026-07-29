<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    sizes?: string
    loading?: 'lazy' | 'eager'
    fetchpriority?: 'high' | 'low' | 'auto'
  }>(),
  {
    loading: 'lazy',
    fetchpriority: 'auto',
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

const useNativeRemote = computed(() => true)

const mergedImgClass = computed(() => {
  const extra = (attrs as { class?: unknown }).class
  const base =
    'absolute inset-0 block h-full w-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none'
  if (!extra) return base
  if (typeof extra === 'string') return `${base} ${extra}`
  return [base, extra]
})
</script>

<template>
  <div class="relative h-full min-h-[4rem] w-full overflow-hidden bg-gradient-to-br from-lumia-beige/50 via-lumia-cream/40 to-lumia-beige/35">
    <template v-if="!failed && src.trim()">
      <img
        v-if="useNativeRemote"
        :class="mergedImgClass"
        :src="src"
        :alt="alt"
        :loading="loading"
        :fetchpriority="fetchpriority"
        decoding="async"
        @error="onImgError"
      />
      <NuxtImg
        v-else
        :class="mergedImgClass"
        :src="src"
        :alt="alt"
        :sizes="sizes"
        :loading="loading"
        @error="onImgError"
      />
    </template>
    <div
      v-else
      class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-lumia-beige/75 to-lumia-cream/65 px-3 text-center"
      role="img"
      :aria-label="alt"
    >
      <span class="font-display text-[11px] font-medium uppercase tracking-[0.35em] text-lumia-ink/30">LUMIA</span>
      <span class="max-w-[90%] font-display text-[10px] leading-tight text-lumia-ink/35 line-clamp-2">{{ alt }}</span>
    </div>
  </div>
</template>
