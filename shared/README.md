# Shared

Código compartido entre frontend (app/) y backend (server/).

## Carpetas

| Carpeta | Contenido |
|---------|-----------|
| `types/` | Interfaces TypeScript (`Product`, `CartItem`, …) |
| `mocks/` | Datos de demostración cuando MongoDB no está configurado |
| `design-system/` | Tokens de diseño (fuente única de verdad) |

## Alias

Importar con `#shared/...` (configurado en `nuxt.config.ts`).

```ts
import type { Product } from '#shared/types/product'
import { MOCK_PRODUCTS } from '#shared/mocks/products'
import { lumiaColors } from '#shared/design-system/tokens'
```
