import { z } from 'zod'

export const productReviewSubmitSchema = z.object({
  stars: z.number().min(1).max(5),
  title: z.string().trim().max(200).optional(),
  body: z.string().trim().min(3, 'Escribe al menos unas palabras').max(4000),
})

export type ProductReviewSubmitInput = z.infer<typeof productReviewSubmitSchema>
