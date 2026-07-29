<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center bg-lumia-canvas px-4 py-16 text-center">
    <p class="font-display text-6xl font-medium text-lumia-ink/20">{{ statusCode }}</p>
    <h1 class="mt-4 font-display text-2xl text-lumia-ink">{{ title }}</h1>
    <p class="mt-3 max-w-md text-sm text-lumia-ink/60">{{ message }}</p>
    <BaseButton to="/" variant="primary" class="mt-8">Volver al inicio</BaseButton>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  error: { statusCode?: number; statusMessage?: string; message?: string }
}>()

const statusCode = computed(() => props.error.statusCode ?? 500)
const title = computed(() =>
  statusCode.value === 404 ? 'Página no encontrada' : 'Algo salió mal'
)
const message = computed(
  () =>
    props.error.message ||
    props.error.statusMessage ||
    (statusCode.value === 404
      ? 'La ruta que buscas no existe o fue movida.'
      : 'Intenta de nuevo en unos momentos.')
)

useHead({ title: `${statusCode.value} — LUMIA` })
</script>
