<template>
  <nav aria-label="Migas de pan" class="text-sm text-lumia-ink/55">
    <ol class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <li v-for="(crumb, i) in items" :key="i" class="flex items-center gap-2">
        <span v-if="i > 0" class="text-lumia-ink/25" aria-hidden="true">/</span>
        <NuxtLink
          v-if="crumb.to && i < items.length - 1"
          :to="crumb.to"
          class="transition-colors duration-200 hover:text-lumia-ink"
        >
          {{ crumb.label }}
        </NuxtLink>
        <span v-else class="font-medium text-lumia-ink">{{ crumb.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  items: { label: string; to?: string }[]
}>()
</script>
