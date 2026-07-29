# Design System — Tokens

Fuente única de verdad para colores, tipografías, sombras y layout.

## Archivo principal

`tokens.ts` — exporta constantes usadas por:

- `tailwind.config.ts`
- Página `/design-system`
- `docs/DESIGN_SYSTEM.md`

## Regla de cambio

1. Modificar `tokens.ts`
2. Sincronizar `tailwind.config.ts` si aplica
3. Verificar en `/design-system`
4. Actualizar `docs/DESIGN_SYSTEM.md`

## Origen de los colores

Verificados contra el CSS compilado del proyecto `lumia` original (`dist/_nuxt/entry.*.css`).
