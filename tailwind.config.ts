import type { Config } from 'tailwindcss'
import {
  lumiaColors,
  lumiaFonts,
  lumiaLayout,
  lumiaShadows,
  lumiaTransitions,
} from './shared/design-system/tokens'

/**
 * Tailwind consume los tokens de shared/design-system/tokens.ts.
 * Ver /design-system y docs/DESIGN_SYSTEM.md
 */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts}',
    './shared/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: { lumia: lumiaColors },
      fontFamily: lumiaFonts,
      maxWidth: { content: lumiaLayout.maxContent },
      boxShadow: {
        soft: lumiaShadows.soft,
        'soft-lg': lumiaShadows.softLg,
      },
      transitionDuration: {
        150: lumiaTransitions.fast,
        200: lumiaTransitions.normal,
      },
      keyframes: {
        'catalog-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'catalog-shimmer': 'catalog-shimmer 1.35s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
