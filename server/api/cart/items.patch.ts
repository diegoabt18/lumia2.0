import { z } from 'zod'
import { isSalesDbConfigured } from '../../database/sales'
import { setCartLineQuantity } from '../../core/sales/cart.repository'
import { buildCartApiResponse } from '../../core/sales/cart-response'
import { resolveCartSubjectForWrite } from '../../utils/cart-context'

const bodySchema = z.object({
  sku: z.string().trim().min(1),
  quantity: z.number().int().min(0).max(99),
})

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Carrito persistente no disponible' })
  }
  const subject = await resolveCartSubjectForWrite(event)
  if (!subject) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const parsed = bodySchema.safeParse(await readBody(event).catch(() => ({})))
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'sku and quantity required' })
  }

  await setCartLineQuantity(subject.cartKey, parsed.data.sku, parsed.data.quantity)
  const cart = await buildCartApiResponse(subject.cartKey)
  return { ok: true, ...cart, source: 'mongo' as const }
})
