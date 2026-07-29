# Mocks

Datos estáticos para desarrollo sin MongoDB Atlas.

## `products.ts`

6 productos de velas con variantes, precios COP y badges.

Se usan cuando:
- `MONGO_CATALOG_URI` no está definido
- La API `/api/products` falla (fallback en `useCatalog`)

## Regla

Los mocks deben reflejar la forma de `shared/types/product.ts` para que la UI no cambie al conectar la API real.
