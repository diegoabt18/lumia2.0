<template>
  <div class="inline-flex items-center gap-1" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="text-lg transition hover:scale-110 focus:outline-none disabled:cursor-default"
      :class="isFilled(n) ? 'text-lumia-gold' : 'text-lumia-ink/25'"
      :disabled="readonly"
      :aria-label="`${n} estrellas`"
      :aria-checked="model >= n"
      role="radio"
      @mouseenter="hover = n"
      @mouseleave="hover = 0"
      @click="select(n)"
    >
      ★
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: number
    readonly?: boolean
    ariaLabel?: string
  }>(),
  { modelValue: 5, readonly: false, ariaLabel: 'Calificación' }
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const hover = ref(0)
const model = computed(() => Math.max(0, Math.min(5, Number(props.modelValue) || 0)))

function isFilled(n: number) {
  const v = hover.value || model.value
  return n <= v
}

function select(n: number) {
  if (props.readonly) return
  emit('update:modelValue', n)
}
</script>
