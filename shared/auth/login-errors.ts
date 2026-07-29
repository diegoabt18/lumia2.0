/**
 * Códigos de error de login (Google OAuth) expuestos al cliente.
 * Mensajes genéricos; el detalle técnico queda en logs del servidor.
 */
export const LOGIN_ERROR_CODES = {
  LG_ERROR000: 'LG_ERROR000',
  LG_ERROR001: 'LG_ERROR001',
  LG_ERROR002: 'LG_ERROR002',
  LG_ERROR003: 'LG_ERROR003',
  LG_ERROR004: 'LG_ERROR004',
  LG_ERROR005: 'LG_ERROR005',
  LG_ERROR006: 'LG_ERROR006',
  LG_ERROR007: 'LG_ERROR007',
} as const

export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[keyof typeof LOGIN_ERROR_CODES]

/** Slugs internos del callback OAuth → código público. */
const SLUG_TO_CODE: Record<string, LoginErrorCode> = {
  oauth_state: LOGIN_ERROR_CODES.LG_ERROR001,
  google_config: LOGIN_ERROR_CODES.LG_ERROR002,
  auth_db: LOGIN_ERROR_CODES.LG_ERROR003,
  google_token: LOGIN_ERROR_CODES.LG_ERROR004,
  google_user: LOGIN_ERROR_CODES.LG_ERROR005,
  oauth_server: LOGIN_ERROR_CODES.LG_ERROR006,
  email_google_conflict: LOGIN_ERROR_CODES.LG_ERROR007,
}

/** Mensaje breve para el cliente (sin detalles de infra). */
const CLIENT_MESSAGES: Record<LoginErrorCode, string> = {
  LG_ERROR000: 'No se pudo completar el inicio de sesión.',
  LG_ERROR001: 'La sesión expiró. Intenta de nuevo.',
  LG_ERROR002: 'No se pudo completar el inicio de sesión.',
  LG_ERROR003: 'No se pudo completar el inicio de sesión.',
  LG_ERROR004: 'No se pudo completar el inicio de sesión.',
  LG_ERROR005: 'No se pudo completar el inicio de sesión.',
  LG_ERROR006: 'No se pudo completar el inicio de sesión.',
  LG_ERROR007: 'No se pudo completar el inicio de sesión.',
}

export function loginErrorCodeFromSlug(slug: string): LoginErrorCode {
  return SLUG_TO_CODE[slug] ?? LOGIN_ERROR_CODES.LG_ERROR000
}

export function isLoginErrorCode(value: string): value is LoginErrorCode {
  return value in CLIENT_MESSAGES
}

/** Texto para toast: mensaje genérico + código de soporte. Acepta código o slug legacy. */
export function loginErrorToastMessage(codeOrSlug: string): string {
  const code = isLoginErrorCode(codeOrSlug) ? codeOrSlug : loginErrorCodeFromSlug(codeOrSlug)
  return `${CLIENT_MESSAGES[code]} (${code})`
}
