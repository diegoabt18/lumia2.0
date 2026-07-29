<script setup lang="ts">
const props = defineProps<{
  stock: number | null | undefined
}>()

type Tone = 'ok' | 'mid' | 'low' | 'out'

const tone = computed<Tone>(() => {
  const s = props.stock
  if (s == null || s <= 0) return 'out'
  if (s <= 5) return 'low'
  if (s <= 15) return 'mid'
  return 'ok'
})

const message = computed(() => {
  const s = props.stock ?? 0
  if (s <= 0) return 'Sin stock temporal'
  if (s <= 5) return `Solo quedan ${s}`
  if (s <= 15) return 'Stock limitado'
  if (s <= 40) return 'Alta demanda'
  return 'Disponible'
})

const pct = computed(() => {
  const s = props.stock ?? 0
  if (s <= 0) return 0
  return Math.min(100, Math.round((Math.min(s, 120) / 120) * 100))
})

const barClass = computed(() => {
  if (tone.value === 'out') return 'bg-lumia-ink/15'
  if (tone.value === 'low') return 'bg-rose-400/90'
  if (tone.value === 'mid') return 'bg-amber-400/90'
  return 'bg-emerald-500/70'
})
</script>

<template>
  <div class="rounded-2xl border border-lumia-ink/8 bg-white/60 px-4 py-3 shadow-soft">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="text-xs font-semibold uppercase tracking-wide text-lumia-ink">{{ message }}</span>
      <span v-if="stock != null && stock > 0" class="text-xs tabular-nums text-lumia-ink/55">{{ stock }} u.</span>
    </div>
    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-lumia-beige/80">
      <div class="h-full rounded-full transition-all duration-500 ease-out" :class="barClass" :style="{ width: `${pct}%` }" />
    </div>
  </div>
</template>
