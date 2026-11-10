<template>
  <div class="flex flex-wrap items-center gap-3">
    <p class="font-display text-2xl tracking-wide text-lumia-ink select-all" data-testid="order-reference">{{ code }}</p>
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full border border-lumia-ink/12 bg-white px-3 py-1.5 text-xs font-medium text-lumia-ink hover:bg-lumia-cream/50"
      @click="copy"
    >
      {{ copied ? 'Copiado' : 'Copiar código' }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ code: string }>()

const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Sin permiso de portapapeles: el código queda seleccionable en pantalla.
  }
}
</script>
