import type { SessionPayload } from '../../../utils/session'

export function canRunMigration(session: SessionPayload | null | undefined): session is SessionPayload {
  return session?.role === 'admin'
}
