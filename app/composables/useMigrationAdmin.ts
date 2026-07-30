import type {
  MigrationLogRecord,
  MigrationStatusResponse,
  MigrationSyncResult,
  MigrationTarget,
} from '#shared/types/migration'
import { SYNC_TARGET_ORDER } from '#shared/types/migration'

const TARGET_LABELS: Record<Exclude<MigrationTarget, 'full'>, string> = {
  categories: 'Categorías',
  products: 'Productos',
  variants: 'Variantes',
  promotions: 'Promociones',
  options: 'Opciones PDP',
}

export function useMigrationAdmin() {
  const status = ref<MigrationStatusResponse | null>(null)
  const history = ref<MigrationLogRecord[]>([])
  const lastResult = ref<MigrationSyncResult | null>(null)
  const loadingStatus = ref(false)
  const loadingHistory = ref(false)
  const runningAction = ref<string | null>(null)
  const error = ref<string | null>(null)

  async function refreshStatus() {
    loadingStatus.value = true
    error.value = null
    try {
      const res = await $fetch<{ ok: boolean; status: MigrationStatusResponse }>(
        '/api/admin/migration/status'
      )
      status.value = res.status
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string; statusCode?: number }
      error.value = err.data?.message ?? err.message ?? 'No se pudo cargar el estado'
      status.value = null
    } finally {
      loadingStatus.value = false
    }
  }

  async function refreshHistory(limit = 15) {
    loadingHistory.value = true
    try {
      const res = await $fetch<{ ok: boolean; items: MigrationLogRecord[] }>(
        '/api/admin/migration/history',
        { query: { limit } }
      )
      history.value = res.items
    } catch {
      history.value = []
    } finally {
      loadingHistory.value = false
    }
  }

  async function dryRun(target: MigrationTarget = 'full') {
    return runAction(`dry-run:${target}`, () =>
      $fetch<{ ok: boolean; result: MigrationSyncResult }>('/api/admin/migration/dry-run', {
        method: 'POST',
        body: { target },
      })
    )
  }

  async function syncFull() {
    return runAction('sync:full', () =>
      $fetch<{ ok: boolean; result: MigrationSyncResult }>('/api/admin/migration/full', {
        method: 'POST',
      })
    )
  }

  async function syncTarget(target: Exclude<MigrationTarget, 'full'>) {
    return runAction(`sync:${target}`, () =>
      $fetch<{ ok: boolean; result: MigrationSyncResult }>(`/api/admin/migration/${target}`, {
        method: 'POST',
      })
    )
  }

  async function runAction<T extends { result: MigrationSyncResult }>(
    key: string,
    call: () => Promise<T>
  ) {
    runningAction.value = key
    error.value = null
    try {
      const res = await call()
      lastResult.value = res.result
      await Promise.all([refreshStatus(), refreshHistory()])
      return res.result
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string }
      error.value = err.data?.message ?? err.message ?? 'La operación falló'
      throw e
    } finally {
      runningAction.value = null
    }
  }

  function targetLabel(target: string): string {
    if (target === 'full') return 'Sync completa'
    return TARGET_LABELS[target as Exclude<MigrationTarget, 'full'>] ?? target
  }

  return {
    status,
    history,
    lastResult,
    loadingStatus,
    loadingHistory,
    runningAction,
    error,
    partialTargets: SYNC_TARGET_ORDER,
    targetLabel,
    refreshStatus,
    refreshHistory,
    dryRun,
    syncFull,
    syncTarget,
  }
}
