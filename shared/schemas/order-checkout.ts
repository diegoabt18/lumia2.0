import { z } from 'zod'

export const orderCheckoutShippingSchema = z.object({
  customerName: z.string().trim().min(2, 'Nombre demasiado corto').max(120),
  email: z.string().trim().email('Email inválido').max(120).optional(),
  phone: z
    .string()
    .trim()
    .min(8, 'Teléfono inválido')
    .max(24)
    .regex(/^[\d\s+()-]+$/, 'Solo dígitos y símbolos de teléfono'),
  address: z.string().trim().min(5, 'Indica una dirección más completa').max(200),
  city: z.string().trim().min(2).max(80),
  reference: z.string().trim().min(1, 'La referencia de entrega es obligatoria').max(200),
  notes: z.string().trim().max(500).optional(),
  /** Token Cloudflare Turnstile (obligatorio en servidor si hay secret configurado). */
  turnstileToken: z.string().trim().min(1).optional(),
})

export type OrderCheckoutShippingInput = z.infer<typeof orderCheckoutShippingSchema>
