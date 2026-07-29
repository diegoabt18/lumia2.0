<template>
  <div v-if="threshold > 0" class="rounded-2xl border border-lumia-ink/[0.06] bg-gradient-to-br from-lumia-beige/35 to-lumia-canvas px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p v-if="unlocked" class="font-display text-[15px] font-semibold leading-snug text-lumia-ink">
          ¡Envío gratis desbloqueado!
        </p>
        <p v-else class="font-display text-[15px] font-semibold leading-snug text-lumia-ink">
          {{ remainingLabel }}
        </p>
        <p class="mt-1 text-[11px] leading-relaxed text-lumia-ink/48">
          Pedidos premium con embalaje protegido y seguimiento.
        </p>
      </div>
      <span
        class="shrink-0 rounded-full border border-lumia-gold/35 bg-lumia-gold/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-lumia-ink/75"
      >
        {{ unlocked ? 'Listo' : `${Math.round(pct)}%` }}
      </span>
    </div>
    <div class="mt-3 h-2 overflow-hidden rounded-full bg-lumia-ink/[0.06]">
      <div
        class="h-full rounded-full bg-gradient-to-r from-lumia-gold/85 via-lumia-gold to-lumia-gold/90 transition-[width] duration-500 ease-out"
        :style="{ width: `${pct}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  subtotal: number
  threshold: number
  remainingLabel: string
}>()

const pct = computed(() => {
  const t = props.threshold
  if (t <= 0) return 100
  return Math.min(100, Math.round((props.subtotal / t) * 1000) / 10)
})

const unlocked = computed(() => props.threshold > 0 && props.subtotal >= props.threshold)
</script>
