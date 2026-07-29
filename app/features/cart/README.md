# Cart — Carrito de compras

Estado del carrito del cliente (tienda pública).

## Archivos

| Archivo | Propósito |
|---------|-----------|
| `stores/cart.ts` | Pinia store: items, count, total, add/remove/update |

## Composable

`app/composables/useCart.ts` — wrapper del store para auto-import en componentes.

## Persistencia

- **Fase 1:** estado en memoria (mock)
- **Fase 3:** sync con `/api/cart` + cookie guest + merge en OAuth

## Tipos

`shared/types/product.ts` → `CartItem`
