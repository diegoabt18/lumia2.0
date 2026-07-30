export type MigrationTarget =
  | 'categories'
  | 'products'
  | 'variants'
  | 'promotions'
  | 'options'
  | 'full'

export type MigrationStatus = 'pending' | 'running' | 'success' | 'failed'

export interface MigrationLogRecord {
  id: string
  target: MigrationTarget | string
  status: MigrationStatus
  rowsRead: number
  rowsWritten: number
  startedAt: string
  finishedAt: string | null
  error: string | null
  triggeredBy: string | null
}

export interface MigrationCounts {
  categories: number
  products: number
  variants: number
  promotions: number
  optionAxes: number
  optionValues: number
  legacyOptions: number
}

export interface IntegrityIssue {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface IntegrityReport {
  ok: boolean
  issues: IntegrityIssue[]
  mongo: MigrationCounts
  d1: MigrationCounts
}

export interface MigrationSyncResult {
  logId: string
  target: MigrationTarget
  dryRun: boolean
  status: MigrationStatus
  rowsRead: number
  rowsWritten: number
  integrity: IntegrityReport
  error?: string
}

export interface MigrationStatusResponse {
  mongoConfigured: boolean
  d1Bound: boolean
  d1Connected: boolean
  schemaVersion: string | null
  /** Configuración: mongo | d1 | auto */
  catalogSourceMode: 'mongo' | 'd1' | 'auto'
  /** Fuente que sirve lecturas públicas ahora mismo */
  activeCatalogSource: 'mongo' | 'd1'
  d1HasProducts: boolean
  /** true cuando auto + D1 listo con productos sync */
  cutoverReady: boolean
  lastSyncAt: string | null
  lastSyncTarget: string | null
  lastSyncBy: string | null
  counts: { mongo: MigrationCounts | null; d1: MigrationCounts | null }
  latestLog: MigrationLogRecord | null
}

export const MIGRATION_TARGETS: MigrationTarget[] = [
  'categories',
  'products',
  'variants',
  'promotions',
  'options',
  'full',
]

export const SYNC_TARGET_ORDER: Exclude<MigrationTarget, 'full'>[] = [
  'categories',
  'products',
  'variants',
  'promotions',
  'options',
]

export function parseMigrationTarget(raw: string | undefined): MigrationTarget | null {
  if (!raw) return null
  return MIGRATION_TARGETS.includes(raw as MigrationTarget) ? (raw as MigrationTarget) : null
}
