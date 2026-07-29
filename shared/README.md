# Shared

Código compartido entre frontend (app/) y backend (server/).

## Carpetas

| Carpeta | Contenido |
|---------|-----------|
| `types/` | Interfaces TypeScript (`Product`, `CartItem`, …) |
| `design-system/` | Tokens de diseño (fuente única de verdad) |

## Alias

Importar con `#shared/...` (configurado en `nuxt.config.ts`).

```ts
import type { Product } from '#shared/types/product'
import { lumiaColors } from '#shared/design-system/tokens'
```
