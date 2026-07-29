<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max: number
    disabled?: boolean
  }>(),
  { min: 1 }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function dec() {
  const next = props.modelValue - 1
  if (next >= props.min) emit('update:modelValue', next)
}

function inc() {
  const next = props.modelValue + 1
  if (next <= props.max) emit('update:modelValue', next)
}

const atMin = computed(() => props.modelValue <= props.min)
const atMax = computed(() => props.modelValue >= props.max)
</script>

<template>
  <div class="inline-flex items-center rounded-xl border border-lumia-ink/12 bg-lumia-canvas">
    <button
      type="button"
      class="flex h-11 w-11 items-center justify-center text-lg text-lumia-ink transition hover:bg-lumia-beige/50 disabled:opacity-35"
      :disabled="disabled || atMin"
      aria-label="Menos"
      @click="dec"
    >
      −
    </button>
    <span class="min-w-[2.5rem] text-center font-display text-lg tabular-nums text-lumia-ink">{{ modelValue }}</span>
    <button
      type="button"
      class="flex h-11 w-11 items-center justify-center text-lg text-lumia-ink transition hover:bg-lumia-beige/50 disabled:opacity-35"
      :disabled="disabled || atMax"
      aria-label="Más"
      @click="inc"
    >
      +
    </button>
  </div>
</template>
