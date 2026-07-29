import { z } from 'zod'
import { isSalesDbConfigured } from '../../database/sales'
import { isCatalogDbConfigured, getCatalogDb } from '../../database/catalog'
import { addCartItem } from '../../core/sales/cart.repository'
import { buildCartApiResponse } from '../../core/sales/cart-response'
import { resolveCartSubjectForWrite } from '../../utils/cart-context'
import { checkRateLimit } from '../../utils/rate-limit'
import { formatVariantLabel } from '#shared/variant-label'
import type { VariantDoc } from '../../core/catalog/infrastructure/product.repository'

const cartItemSnapshotSchema = z.object({
  productSlug: z.string().trim().min(1).max(120),
  productName: z.string().trim().min(1).max(200),
  variantLabel: z.string().trim().max(200).optional(),
  currency: z.string().trim().min(3).max(3).optional(),
  imagePath: z.string().trim().max(500).nullable().optional(),
})

const bodySchema = z.object({
  sku: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(99).optional(),
  product: cartItemSnapshotSchema.optional(),
})

export default defineEventHandler(async (event) => {
  if (!isSalesDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Carrito persistente no disponible (MongoDB sales)' })
  }
  const subject = await resolveCartSubjectForWrite(event)
  if (!subject) throw createError({ statusCode: 401, message: 'Unauthorized' })

  checkRateLimit(event, 'cart:add', { max: 40, windowMs: 60_000, keySuffix: subject.cartKey })

  const parsed = bodySchema.safeParse(await readBody(event).catch(() => ({})))
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Datos de carrito inválidos' })
  }

  const { sku, quantity = 1, product: snapshot } = parsed.data

  if (!isCatalogDbConfigured()) {
    throw createError({ statusCode: 503, message: 'Catálogo no disponible' })
  }

  const db = await getCatalogDb()
  const [variant, inv] = await Promise.all([
    db.collection<VariantDoc>('variants').findOne(
      { sku },
      {
        projection: {
          sku: 1,
          product_slug: 1,
          options: 1,
          price: 1,
          currency: 1,
          image_path: 1,
          stock: 1,
          available: 1,
          is_per_order: 1,
        },
      }
    ),
    db.collection('inventory_items').findOne({ sku }, { projection: { quantity: 1, reserved: 1, is_per_order: 1 } }),
  ])
  if (!variant) throw createError({ statusCode: 404, message: 'Variant not found' })

  const isMadeToOrder = Boolean(variant.is_per_order || inv?.is_per_order)
  const available = isMadeToOrder
    ? 99
    : Math.max(
        0,
        inv
          ? Number(inv.quantity ?? 0) - Number(inv.reserved ?? 0)
          : Number(variant.available ?? variant.stock ?? 0)
      )

  if (!isMadeToOrder && available <= 0) throw createError({ statusCode: 409, message: 'Sin stock' })

  const finalQty = isMadeToOrder ? quantity : Math.min(quantity, available)

  await addCartItem(subject.cartKey, {
    sku: variant.sku,
    productSlug: snapshot?.productSlug ?? variant.product_slug,
    productName: snapshot?.productName ?? variant.sku,
    variantLabel: snapshot?.variantLabel ?? formatVariantLabel(variant.options, variant.sku),
    quantity: finalQty,
    unitPrice: variant.price,
    currency: snapshot?.currency ?? variant.currency ?? 'COP',
    imagePath: snapshot?.imagePath ?? variant.image_path ?? null,
  })

  const cart = await buildCartApiResponse(subject.cartKey)
  return { ok: true, ...cart, source: 'mongo' as const }
})
