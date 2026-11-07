<script setup lang="ts">
const props = defineProps<{
  page: number
  pageSize: number
  total: number
  totalPages: number
  pageSizeOptions: number[]
}>()

const emit = defineEmits<{
  'change-page': [page: number]
  'change-size': [size: number]
}>()

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const to = computed(() => Math.min(props.page * props.pageSize, props.total))

/** Números de página con elipsis: primera, última y vecinas de la actual. */
const pageItems = computed<Array<number | 'gap'>>(() => {
  const last = props.totalPages
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const pages = new Set([1, last, props.page - 1, props.page, props.page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b)
  const out: Array<number | 'gap'> = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] ?? p) > 1) out.push('gap')
    out.push(p)
  })
  return out
})

function onSizeChange(event: Event) {
  emit('change-size', Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 border-t border-lumia-ink/8 pt-3 text-xs text-lumia-ink/60">
    <p>
      Mostrando <span class="font-semibold text-lumia-ink">{{ from }}–{{ to }}</span> de
      <span class="font-semibold text-lumia-ink">{{ total }}</span> productos
    </p>

    <div class="flex items-center gap-2">
      <label class="flex items-center gap-1.5">
        <span>Por página</span>
        <select
          class="lumia-field-input h-8 w-auto px-2 py-0 text-xs"
          :value="pageSize"
          @change="onSizeChange"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>

      <nav class="flex items-center gap-1" aria-label="Paginación de productos">
        <button
          type="button"
          class="h-8 rounded-lg border border-lumia-ink/12 px-2.5 font-medium text-lumia-ink/80 transition hover:border-lumia-ink/30 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="page <= 1"
          @click="emit('change-page', page - 1)"
        >
          Anterior
        </button>
        <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
          <span v-if="item === 'gap'" class="px-1 text-lumia-ink/40">…</span>
          <button
            v-else
            type="button"
            class="h-8 min-w-8 rounded-lg border px-2 font-medium transition"
            :class="item === page
              ? 'border-lumia-ink bg-lumia-ink text-lumia-cream'
              : 'border-lumia-ink/12 text-lumia-ink/80 hover:border-lumia-ink/30'"
            :aria-current="item === page ? 'page' : undefined"
            @click="emit('change-page', item)"
          >
            {{ item }}
          </button>
        </template>
        <button
          type="button"
          class="h-8 rounded-lg border border-lumia-ink/12 px-2.5 font-medium text-lumia-ink/80 transition hover:border-lumia-ink/30 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="page >= totalPages"
          @click="emit('change-page', page + 1)"
        >
          Siguiente
        </button>
      </nav>
    </div>
  </div>
</template>
