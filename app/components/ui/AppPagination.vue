<template>
  <div
    v-if="total > 0"
    class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
  >
    <p v-if="rangeLabel" class="text-sm text-lumia-ink/55">
      {{ rangeLabel }}
    </p>
    <div class="flex flex-wrap items-center gap-2">
      <div v-if="showLimitSelect" class="flex items-center gap-2">
        <label class="sr-only" for="app-pagination-limit">Por página</label>
        <select
          id="app-pagination-limit"
          class="rounded-lg border border-lumia-ink/15 bg-lumia-canvas px-2 py-1.5 text-sm text-lumia-ink transition-colors hover:border-lumia-ink/25 focus:border-lumia-gold/50 focus:outline-none focus:ring-1 focus:ring-lumia-gold/30"
          :value="limit"
          @change="onLimitChange"
        >
          <option v-for="opt in limitOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>

      <nav v-if="pages > 1" class="flex flex-wrap items-center gap-1" aria-label="Paginación">
        <button
          type="button"
          class="inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-lumia-ink/12 px-2 text-sm text-lumia-ink/80 transition-colors hover:border-lumia-gold/35 hover:bg-lumia-cream/50 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="page <= 1 || disabled"
          @click="emit('update:page', page - 1)"
        >
          <span class="sr-only">Anterior</span>
          <span aria-hidden="true">‹</span>
        </button>

        <template v-for="(n, idx) in visiblePages" :key="'p-' + idx + '-' + String(n)">
          <span v-if="n === '…'" class="px-1 text-sm text-lumia-ink/35" aria-hidden="true">…</span>
          <button
            v-else
            type="button"
            class="inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border px-2.5 text-sm tabular-nums transition-colors"
            :class="
              n === page
                ? 'border-lumia-gold/40 bg-lumia-cream/60 text-lumia-ink'
                : 'border-lumia-ink/12 text-lumia-ink/80 hover:border-lumia-gold/35 hover:bg-lumia-cream/50'
            "
            :disabled="disabled"
            @click="emit('update:page', n as number)"
          >
            {{ n }}
          </button>
        </template>

        <button
          type="button"
          class="inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-lumia-ink/12 px-2 text-sm text-lumia-ink/80 transition-colors hover:border-lumia-gold/35 hover:bg-lumia-cream/50 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="page >= pages || disabled"
          @click="emit('update:page', page + 1)"
        >
          <span class="sr-only">Siguiente</span>
          <span aria-hidden="true">›</span>
        </button>
      </nav>

      <p v-if="pages > 1" class="text-xs tabular-nums text-lumia-ink/45">
        Página {{ page }} / {{ pages }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    page: number
    pages: number
    total: number
    limit: number
    rangeStart?: number
    rangeEnd?: number
    disabled?: boolean
    showLimitSelect?: boolean
    limitOptions?: number[]
    itemLabel?: string
  }>(),
  {
    disabled: false,
    showLimitSelect: true,
    limitOptions: () => [12, 24, 48],
    itemLabel: 'productos',
  }
)

const emit = defineEmits<{
  'update:page': [page: number]
  'update:limit': [limit: number]
}>()

const rangeLabel = computed(() => {
  if (props.total <= 0) return ''
  const start = props.rangeStart ?? (props.page - 1) * props.limit + 1
  const end = props.rangeEnd ?? Math.min(props.page * props.limit, props.total)
  return `Mostrando ${start}–${end} de ${props.total} ${props.itemLabel}`
})

function onLimitChange(e: Event) {
  const v = parseInt((e.target as HTMLSelectElement).value, 10)
  if (Number.isFinite(v)) emit('update:limit', v)
}

function buildVisiblePages(p: number, totalPages: number): (number | '…')[] {
  const total = Math.max(1, totalPages)
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set<number>()
  set.add(1)
  set.add(total)
  for (let i = p - 1; i <= p + 1; i++) {
    if (i >= 1 && i <= total) set.add(i)
  }
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push('…')
    out.push(sorted[i]!)
  }
  return out
}

const visiblePages = computed(() => buildVisiblePages(props.page, props.pages))
</script>
