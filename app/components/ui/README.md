# Componentes UI base

Primitivos reutilizables de la tienda. Sin dependencia de Nuxt UI.

## Componentes

| Archivo | Propósito |
|---------|-----------|
| `BaseButton.vue` | CTA con variantes `primary`, `secondary`, `ghost`. Soporta `to` (NuxtLink) o `button`. |
| `BaseContainer.vue` | Contenedor editorial `max-w-content` (1280px) con padding responsive. |
| `BaseCard.vue` | Superficie con `shadow-soft`, fondo cream semitransparente. |

## Convenciones

- Altura mínima táctil: `min-h-11` en botones
- Focus ring: `focus-visible:outline-lumia-gold/60`
- Transiciones: `duration-200`

## Tokens relacionados

Ver `shared/design-system/tokens.ts` y `/design-system`.
