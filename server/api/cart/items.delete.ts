import { z } from 'zod'
import { isSalesDbConfigured } from '../../database/sales'
import { removeCartItem } from '../../core/sales/cart.repository'
import { buildCartApiResponse } from '../../core/sales/cart-response'
import { resolveCartSubjectForWrite } from '../../utils/cart-context'

const bodySchema = z.object({
  sku: z.string().trim().min(1),
})

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Carrito persistente no disponible' })
  }
  const subject = await resolveCartSubjectForWrite(event)
  if (!subject) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const parsed = bodySchema.safeParse(await readBody(event).catch(() => ({})))
  if (!parsed.success) throw createError({ statusCode: 400, message: 'sku required' })

  await removeCartItem(subject.cartKey, parsed.data.sku)
  const cart = await buildCartApiResponse(subject.cartKey)
  return { ok: true, ...cart, source: 'mongo' as const }
})
