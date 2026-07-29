/**
 * Fuente única de verdad del sistema de diseño Lumia.
 * Usado por tailwind.config.ts, la página /design-system y docs/DESIGN_SYSTEM.md
 *
 * Los valores de cream, gold y beige provienen del tailwind.config.ts del proyecto
 * original (precedencia sobre nuxt.config inline). Verificados contra CSS compilado.
 */

export const lumiaColors = {
  black: '#0F0F0F',
  cream: '#F6F1E7',
  gold: '#C9A24A',
  beige: '#E8DCC8',
  ink: '#2B2B2B',
  canvas: '#FAF8F5',
  success: '#D6E5DA',
} as const

export const lumiaFonts = {
  display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
  sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
} as const

export const lumiaLayout = {
  maxContent: '1280px',
} as const

export const lumiaShadows = {
  soft: '0 4px 24px -4px rgba(43, 43, 43, 0.08), 0 8px 32px -8px rgba(43, 43, 43, 0.06)',
  softLg: '0 12px 40px -12px rgba(43, 43, 43, 0.12)',
} as const

export const lumiaRadii = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
  full: 'rounded-full',
  button: 'rounded-xl',
} as const

export const lumiaTransitions = {
  fast: '150ms',
  normal: '200ms',
} as const

/** Paleta para referencia visual en /design-system */
export const designSystemPalette = [
  { token: 'lumia-black', hex: lumiaColors.black, usage: 'Textos fuertes, botones primary' },
  { token: 'lumia-ink', hex: lumiaColors.ink, usage: 'Texto principal del cuerpo' },
  { token: 'lumia-gold', hex: lumiaColors.gold, usage: 'Acentos, badges, hover links' },
  { token: 'lumia-beige', hex: lumiaColors.beige, usage: 'Fondos secundarios, hover' },
  { token: 'lumia-cream', hex: lumiaColors.cream, usage: 'Cards, superficies cálidas' },
  { token: 'lumia-canvas', hex: lumiaColors.canvas, usage: 'Fondo general de la tienda' },
  { token: 'lumia-success', hex: lumiaColors.success, usage: 'Estados positivos suaves' },
] as const
