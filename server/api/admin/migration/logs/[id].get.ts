import { requireMigrationAdmin, createMigrationWriteSession } from '../../../../utils/require-migration'
import { getMigrationLog } from '../../../../core/migration/infrastructure/migration-log.repository'

export default defineEventHandler(async (event) => {
  await requireMigrationAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID requerido' })

  const session = createMigrationWriteSession(event)
  const item = await getMigrationLog(session, id)
  if (!item) throw createError({ statusCode: 404, message: 'Log no encontrado' })

  return { ok: true, item }
})
