<template>
  <div
    :class="[
      'rounded-xl bg-lumia-cream/80 shadow-soft backdrop-blur-sm transition-shadow duration-200',
      hoverable && 'hover:shadow-soft-lg',
      padded && 'p-6 sm:p-8',
      border && 'border border-lumia-ink/6',
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    hoverable?: boolean
    padded?: boolean
    border?: boolean
  }>(),
  {
    hoverable: false,
    padded: true,
    border: true,
  }
)
</script>
