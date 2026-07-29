import { SignJWT, jwtVerify } from 'jose'

const PURPOSE = 'order_view'
const DEFAULT_TTL_SEC = 60 * 60 * 24 * 7

export async function signOrderAccessToken(orderNumber: string, secret: string, maxAgeSec = DEFAULT_TTL_SEC) {
  const key = new TextEncoder().encode(secret)
  return new SignJWT({ orderNumber, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(key)
}

export async function decodeOrderAccessToken(
  token: string,
  secret: string
): Promise<{ orderNumber: string } | null> {
  try {
    const key = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, key)
    if (payload.purpose !== PURPOSE || typeof payload.orderNumber !== 'string') return null
    return { orderNumber: payload.orderNumber }
  } catch {
    return null
  }
}

export async function verifyOrderAccessToken(
  token: string,
  orderNumber: string,
  secret: string
): Promise<boolean> {
  const decoded = await decodeOrderAccessToken(token, secret)
  return decoded?.orderNumber === orderNumber
}
