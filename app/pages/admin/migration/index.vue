<template>
  <BaseContainer class="space-y-8">
    <section class="rounded-2xl border border-lumia-ink/8 bg-white p-6 shadow-soft">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="font-display text-2xl text-lumia-ink">Mongo → D1</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-lumia-ink/60">
            Sincroniza el catálogo de lectura hacia Cloudflare D1. El stock y el carrito siguen en MongoDB.
          </p>
        </div>
        <BaseButton variant="secondary" :disabled="loadingStatus" @click="onRefresh">
          {{ loadingStatus ? 'Actualizando…' : 'Actualizar' }}
        </BaseButton>
      </div>

      <p v-if="error" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {{ error }}
      </p>

      <div v-if="loadingStatus && !status" class="mt-6 text-sm text-lumia-ink/50">Cargando estado…</div>

      <div v-else-if="status" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-lumia-ink/8 bg-lumia-cream/30 p-4">
          <p class="text-xs font-medium uppercase tracking-wider text-lumia-ink/45">MongoDB</p>
          <p class="mt-1 font-display text-lg" :class="status.mongoConfigured ? 'text-emerald-700' : 'text-amber-700'">
            {{ status.mongoConfigured ? 'OK' : 'Pendiente' }}
          </p>
          <p class="mt-1 text-xs text-lumia-ink/55">{{ mongoDetail }}</p>
        </div>
        <div class="rounded-xl border border-lumia-ink/8 bg-lumia-cream/30 p-4">
          <p class="text-xs font-medium uppercase tracking-wider text-lumia-ink/45">D1 binding</p>
          <p class="mt-1 font-display text-lg" :class="status.d1Bound ? 'text-emerald-700' : 'text-amber-700'">
            {{ status.d1Bound ? 'OK' : 'Pendiente' }}
          </p>
          <p class="mt-1 text-xs text-lumia-ink/55">CATALOG_DB en Worker</p>
        </div>
        <div class="rounded-xl border border-lumia-ink/8 bg-lumia-cream/30 p-4">
          <p class="text-xs font-medium uppercase tracking-wider text-lumia-ink/45">D1 conectado</p>
          <p class="mt-1 font-display text-lg" :class="status.d1Connected ? 'text-emerald-700' : 'text-amber-700'">
            {{ status.d1Connected ? 'OK' : 'Pendiente' }}
          </p>
          <p class="mt-1 text-xs text-lumia-ink/55">{{ d1SchemaDetail }}</p>
        </div>
        <div class="rounded-xl border border-lumia-ink/8 bg-lumia-cream/30 p-4">
          <p class="text-xs font-medium uppercase tracking-wider text-lumia-ink/45">Última sync</p>
          <p class="mt-1 font-display text-lg" :class="status.lastSyncAt ? 'text-emerald-700' : 'text-amber-700'">
            {{ status.lastSyncAt ? 'OK' : 'Nunca' }}
          </p>
          <p class="mt-1 text-xs text-lumia-ink/55">{{ lastSyncDetail }}</p>
        </div>
      </div>
    </section>

    <section v-if="status?.counts.mongo || status?.counts.d1" class="rounded-2xl border border-lumia-ink/8 bg-white p-6 shadow-soft">
      <h3 class="font-display text-lg text-lumia-ink">Conteos</h3>
      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead>
            <tr class="border-b border-lumia-ink/10 text-lumia-ink/50">
              <th class="py-2 pr-4 font-medium">Entidad</th>
              <th class="py-2 pr-4 font-medium">Mongo</th>
              <th class="py-2 font-medium">D1</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in countRows" :key="row.key" class="border-b border-lumia-ink/5">
              <td class="py-2.5 pr-4 text-lumia-ink">{{ row.label }}</td>
              <td class="py-2.5 pr-4 tabular-nums text-lumia-ink/70">{{ row.mongo }}</td>
              <td class="py-2.5 tabular-nums" :class="row.match ? 'text-emerald-700' : 'text-amber-700'">
                {{ row.d1 }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="rounded-2xl border border-lumia-ink/8 bg-white p-6 shadow-soft">
      <h3 class="font-display text-lg text-lumia-ink">Acciones</h3>
      <p class="mt-2 text-sm text-lumia-ink/55">
        Ejecuta primero un dry-run para ver cuántas filas se migrarían sin escribir en D1.
      </p>

      <div class="mt-5 flex flex-wrap gap-3">
        <BaseButton
          variant="secondary"
          :disabled="Boolean(runningAction)"
          @click="onDryRunFull"
        >
          {{ runningAction === 'dry-run:full' ? 'Simulando…' : 'Dry-run completo' }}
        </BaseButton>
        <BaseButton :disabled="Boolean(runningAction) || !canSync" @click="onSyncFull">
          {{ runningAction === 'sync:full' ? 'Sincronizando…' : 'Sync completa' }}
        </BaseButton>
      </div>

      <div class="mt-6 flex flex-wrap gap-2">
        <BaseButton
          v-for="target in partialTargets"
          :key="target"
          variant="ghost"
          :disabled="Boolean(runningAction) || !canSync"
          @click="onSyncTarget(target)"
        >
          {{ runningAction === `sync:${target}` ? '…' : targetLabel(target) }}
        </BaseButton>
      </div>

      <p v-if="!canSync" class="mt-4 text-xs text-amber-700">
        Sync deshabilitada: necesitas D1 conectado y Mongo configurado. Usa <code class="rounded bg-lumia-beige/60 px-1">npm run cf:dev</code>.
      </p>
    </section>

    <section v-if="lastResult" class="rounded-2xl border border-lumia-ink/8 bg-white p-6 shadow-soft">
      <h3 class="font-display text-lg text-lumia-ink">Último resultado</h3>
      <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt class="text-lumia-ink/50">Target</dt>
          <dd class="font-medium text-lumia-ink">{{ targetLabel(lastResult.target) }}</dd>
        </div>
        <div>
          <dt class="text-lumia-ink/50">Modo</dt>
          <dd class="font-medium text-lumia-ink">{{ lastResult.dryRun ? 'Dry-run' : 'Escritura' }}</dd>
        </div>
        <div>
          <dt class="text-lumia-ink/50">Leídas</dt>
          <dd class="tabular-nums font-medium text-lumia-ink">{{ lastResult.rowsRead }}</dd>
        </div>
        <div>
          <dt class="text-lumia-ink/50">Escritas</dt>
          <dd class="tabular-nums font-medium text-lumia-ink">{{ lastResult.rowsWritten }}</dd>
        </div>
      </dl>

      <ul v-if="lastResult.integrity.issues.length" class="mt-4 space-y-2">
        <li
          v-for="(issue, i) in lastResult.integrity.issues"
          :key="i"
          class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {{ issue.message }}
        </li>
      </ul>
      <p v-else class="mt-4 text-sm text-emerald-700">Integridad OK (conteos alineados).</p>
    </section>

    <section class="rounded-2xl border border-lumia-ink/8 bg-white p-6 shadow-soft">
      <h3 class="font-display text-lg text-lumia-ink">Historial</h3>
      <p v-if="loadingHistory" class="mt-4 text-sm text-lumia-ink/50">Cargando…</p>
      <p v-else-if="!history.length" class="mt-4 text-sm text-lumia-ink/50">Sin syncs registradas aún.</p>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead>
            <tr class="border-b border-lumia-ink/10 text-lumia-ink/50">
              <th class="py-2 pr-4 font-medium">Fecha</th>
              <th class="py-2 pr-4 font-medium">Target</th>
              <th class="py-2 pr-4 font-medium">Estado</th>
              <th class="py-2 pr-4 font-medium">Filas</th>
              <th class="py-2 font-medium">Por</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in history" :key="log.id" class="border-b border-lumia-ink/5">
              <td class="py-2.5 pr-4 whitespace-nowrap text-lumia-ink/70">{{ formatDate(log.startedAt) }}</td>
              <td class="py-2.5 pr-4 text-lumia-ink">{{ targetLabel(String(log.target)) }}</td>
              <td class="py-2.5 pr-4">
                <span :class="statusClass(log.status)">{{ log.status }}</span>
              </td>
              <td class="py-2.5 pr-4 tabular-nums text-lumia-ink/70">
                {{ log.rowsWritten }}/{{ log.rowsRead }}
              </td>
              <td class="py-2.5 text-lumia-ink/55">{{ log.triggeredBy ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </BaseContainer>
</template>

<script setup lang="ts">
import type { MigrationCounts, MigrationStatus } from '#shared/types/migration'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({
  title: 'Migración catálogo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const {
  status,
  history,
  lastResult,
  loadingStatus,
  loadingHistory,
  runningAction,
  error,
  partialTargets,
  targetLabel,
  refreshStatus,
  refreshHistory,
  dryRun,
  syncFull,
  syncTarget,
} = useMigrationAdmin()

const canSync = computed(
  () => Boolean(status.value?.mongoConfigured && status.value?.d1Bound && status.value?.d1Connected)
)

const mongoDetail = computed(() =>
  status.value?.mongoConfigured ? 'URI configurada' : 'Falta NUXT_MONGO_CATALOG_URI'
)

const d1SchemaDetail = computed(() => {
  if (status.value?.schemaVersion) return `Schema ${status.value.schemaVersion}`
  if (status.value?.d1Bound && !status.value?.d1Connected) {
    return 'Ejecuta npm run db:d1:migrate y reinicia el dev server'
  }
  return 'Sin schema'
})

const lastSyncDetail = computed(() => {
  if (!status.value?.lastSyncAt) return 'Nunca'
  const parts = [formatDate(status.value.lastSyncAt)]
  if (status.value.lastSyncTarget) parts.push(targetLabel(status.value.lastSyncTarget))
  return parts.join(' · ')
})

const COUNT_LABELS: { key: keyof MigrationCounts; label: string }[] = [
  { key: 'categories', label: 'Categorías' },
  { key: 'products', label: 'Productos' },
  { key: 'variants', label: 'Variantes' },
  { key: 'promotions', label: 'Promociones' },
  { key: 'optionAxes', label: 'Ejes opciones' },
  { key: 'optionValues', label: 'Valores opciones' },
  { key: 'legacyOptions', label: 'Opciones legacy' },
]

const countRows = computed(() => {
  const mongo = status.value?.counts.mongo
  const d1 = status.value?.counts.d1
  if (!mongo && !d1) return []
  return COUNT_LABELS.map(({ key, label }) => {
    const m = mongo?.[key] ?? '—'
    const d = d1?.[key] ?? '—'
    return {
      key,
      label,
      mongo: m,
      d1: d,
      match: typeof m === 'number' && typeof d === 'number' && m === d,
    }
  })
})

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: useRuntimeConfig().public.storeTimezone || 'America/Bogota',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function statusClass(s: MigrationStatus) {
  if (s === 'success') return 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
  if (s === 'failed') return 'rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800'
  if (s === 'running') return 'rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800'
  return 'rounded-full bg-lumia-beige px-2 py-0.5 text-xs font-medium text-lumia-ink/70'
}

async function onRefresh() {
  await Promise.all([refreshStatus(), refreshHistory()])
}

async function onDryRunFull() {
  await dryRun('full')
}

async function onSyncFull() {
  if (!confirm('¿Ejecutar sync completa Mongo → D1?')) return
  await syncFull()
}

async function onSyncTarget(target: (typeof partialTargets)[number]) {
  if (!confirm(`¿Sincronizar solo ${targetLabel(target)}?`)) return
  await syncTarget(target)
}

onMounted(() => {
  void onRefresh()
})
</script>
