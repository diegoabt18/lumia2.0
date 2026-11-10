<template>
  <Teleport v-if="open" to="body">
    <div class="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" @keydown.esc="emit('cancel')">
      <div class="absolute inset-0 bg-lumia-ink/45 backdrop-blur-[2px]" aria-hidden="true" @click="emit('cancel')" />
      <div
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descId"
        class="relative w-full max-w-md rounded-2xl bg-lumia-canvas p-6 shadow-soft-lg"
      >
        <h2 :id="titleId" class="font-display text-xl text-lumia-ink">{{ title }}</h2>
        <div :id="descId" class="mt-3 space-y-2 text-sm leading-relaxed text-lumia-ink/70">
          <slot>{{ description }}</slot>
        </div>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton type="button" variant="ghost" :disabled="pending" @click="emit('cancel')">
            {{ cancelLabel }}
          </BaseButton>
          <BaseButton type="button" variant="primary" :disabled="pending" @click="emit('confirm')">
            {{ pending ? 'Guardando…' : confirmLabel }}
          </BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    pending?: boolean
  }>(),
  {
    description: '',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    pending: false,
  },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const uid = useId()
const titleId = `confirm-title-${uid}`
const descId = `confirm-desc-${uid}`

// Cerrar con Escape aunque el foco esté fuera del diálogo.
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('cancel')
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>
