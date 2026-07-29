<script setup lang="ts">
const props = defineProps<{
  salesBadge?: 'bestseller' | 'popular' | null
  handmade?: boolean
  eco?: boolean
}>()

type Badge = { label: string; class: string }

const items = computed<Badge[]>(() => {
  const list: Badge[] = []
  if (props.salesBadge === 'bestseller') {
    list.push({ label: 'Bestseller', class: 'bg-lumia-ink text-lumia-cream' })
  } else if (props.salesBadge === 'popular') {
    list.push({ label: 'Popular', class: 'bg-lumia-gold/25 text-lumia-ink' })
  }
  if (props.handmade !== false) {
    list.push({ label: 'Handmade', class: 'border border-lumia-ink/12 bg-white text-lumia-ink/85' })
  }
  if (props.eco) {
    list.push({ label: 'Eco', class: 'border border-emerald-200/80 bg-emerald-50/80 text-emerald-900/90' })
  }
  return list
})
</script>

<template>
  <div v-if="items.length" class="flex flex-wrap gap-2">
    <span
      v-for="b in items"
      :key="b.label"
      class="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
      :class="b.class"
    >
      {{ b.label }}
    </span>
  </div>
</template>
