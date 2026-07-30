import {
  isD1MissingTableError,
  type CatalogD1DatabaseSession,
} from '../../../database/catalog-d1'
import type { MigrationLogRecord, MigrationStatus } from '#shared/types/migration'

interface MigrationLogRow {
  id: string
  target: string
  status: string
  rows_read: number
  rows_written: number
  started_at: string
  finished_at: string | null
  error: string | null
  triggered_by: string | null
}

function mapLog(row: MigrationLogRow): MigrationLogRecord {
  return {
    id: row.id,
    target: row.target,
    status: row.status as MigrationStatus,
    rowsRead: row.rows_read,
    rowsWritten: row.rows_written,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    error: row.error,
    triggeredBy: row.triggered_by,
  }
}

export async function createMigrationLog(
  session: CatalogD1DatabaseSession,
  input: { id: string; target: string; triggeredBy: string | null }
): Promise<void> {
  await session
    .prepare(
      `INSERT INTO migration_logs (id, target, status, rows_read, rows_written, started_at, triggered_by)
       VALUES (?, ?, 'running', 0, 0, datetime('now'), ?)`
    )
    .bind(input.id, input.target, input.triggeredBy)
    .run()
}

export async function finishMigrationLog(
  session: CatalogD1DatabaseSession,
  input: {
    id: string
    status: MigrationStatus
    rowsRead: number
    rowsWritten: number
    error?: string | null
  }
): Promise<void> {
  await session
    .prepare(
      `UPDATE migration_logs
       SET status = ?, rows_read = ?, rows_written = ?, finished_at = datetime('now'), error = ?
       WHERE id = ?`
    )
    .bind(input.status, input.rowsRead, input.rowsWritten, input.error ?? null, input.id)
    .run()
}

export async function listMigrationLogs(
  session: CatalogD1DatabaseSession,
  limit = 20
): Promise<MigrationLogRecord[]> {
  try {
    const { results } = await session
      .prepare(
        `SELECT id, target, status, rows_read, rows_written, started_at, finished_at, error, triggered_by
         FROM migration_logs
         ORDER BY started_at DESC
         LIMIT ?`
      )
      .bind(Math.min(Math.max(limit, 1), 100))
      .all<MigrationLogRow>()

    return results.map(mapLog)
  } catch (error) {
    if (isD1MissingTableError(error)) return []
    throw error
  }
}

export async function getMigrationLog(
  session: CatalogD1DatabaseSession,
  id: string
): Promise<MigrationLogRecord | null> {
  try {
    const row = await session
      .prepare(
        `SELECT id, target, status, rows_read, rows_written, started_at, finished_at, error, triggered_by
         FROM migration_logs WHERE id = ? LIMIT 1`
      )
      .bind(id)
      .first<MigrationLogRow>()

    return row ? mapLog(row) : null
  } catch (error) {
    if (isD1MissingTableError(error)) return null
    throw error
  }
}

export async function getMigrationMetaValue(
  session: CatalogD1DatabaseSession,
  key: string
): Promise<string | null> {
  try {
    const row = await session
      .prepare(`SELECT value FROM migration_meta WHERE key = ? LIMIT 1`)
      .bind(key)
      .first<{ value: string }>()
    return row?.value ?? null
  } catch (error) {
    if (isD1MissingTableError(error)) return null
    throw error
  }
}

export async function getLatestMigrationLog(
  session: CatalogD1DatabaseSession
): Promise<MigrationLogRecord | null> {
  const rows = await listMigrationLogs(session, 1)
  return rows[0] ?? null
}
