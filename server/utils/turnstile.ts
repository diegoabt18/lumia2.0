interface TurnstileVerifyResponse {
  success?: boolean
  'error-codes'?: string[]
}

/** Verifica token de Cloudflare Turnstile. */
export async function verifyTurnstileToken(
  token: string,
  secret: string,
  remoteIp?: string | null
): Promise<boolean> {
  const trimmed = token.trim()
  const secretKey = secret.trim()
  if (!trimmed || !secretKey) return false

  const body = new URLSearchParams()
  body.set('secret', secretKey)
  body.set('response', trimmed)
  if (remoteIp?.trim()) body.set('remoteip', remoteIp.trim())

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return false
    const data = (await res.json()) as TurnstileVerifyResponse
    return data.success === true
  } catch {
    return false
  }
}
