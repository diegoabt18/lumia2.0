import { z } from 'zod'
import { isSalesDbConfigured } from '../../database/sales'
import { getSalesDb } from '../../database/sales'
import { checkRateLimit } from '../../utils/rate-limit'
import { sendNewsletterWelcomeEmail } from '../../utils/email'

const bodySchema = z.object({
  email: z.string().trim().email('Email inválido').max(120),
})

export default defineEventHandler(async (event) => {
  checkRateLimit(event, 'newsletter:subscribe', { max: 5, windowMs: 60_000 })

  const parsed = bodySchema.safeParse(await readBody(event).catch(() => ({})))
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0]?.message ?? 'Email inválido' })
  }

  const email = parsed.data.email.toLowerCase()

  if (isSalesDbConfigured()) {
    const db = await getSalesDb()
    await db.collection('newsletter_subscribers').updateOne(
      { email },
      {
        $setOnInsert: { email, createdAt: new Date(), source: 'website' },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    )
  }

  void sendNewsletterWelcomeEmail(email).catch((e) =>
    console.warn('[newsletter] welcome email failed', (e as Error)?.message)
  )

  return { ok: true }
})
