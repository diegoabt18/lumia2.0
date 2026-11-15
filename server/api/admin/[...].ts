/**
 * Lumia 2.0 ya no reenvía cualquier ruta /api/admin/* al Server. Solo existen las rutas explícitas
 * que usa el POS (pos/*, orders/:id/payments); el resto de la administración vive en Lumia Admin.
 * Cualquier otra ruta administrativa responde 404 en lugar de llegar al Server.
 */
export default defineEventHandler(() => {
  throw createError({ statusCode: 404, message: 'Recurso no disponible.' })
})
