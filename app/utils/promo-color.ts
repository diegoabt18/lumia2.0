/** Dorado de marca usado cuando la promoción no define color. */
export const DEFAULT_PROMO_COLOR = '#C9A24A'

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

/** Devuelve un HEX válido; cualquier otro valor cae al color por defecto (los datos externos no son confiables). */
export function normalizePromoColor(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_PROMO_COLOR
  const value = raw.trim()
  return HEX_COLOR.test(value) ? value : DEFAULT_PROMO_COLOR
}

/** Texto oscuro sobre fondos claros y blanco sobre fondos oscuros (luminancia percibida). */
export function promoTextColor(hex: string): string {
  const full = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex
  const r = parseInt(full.slice(1, 3), 16)
  const g = parseInt(full.slice(3, 5), 16)
  const b = parseInt(full.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#2B2B2B' : '#FFFFFF'
}
