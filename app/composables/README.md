# Composables

Lógica reutilizable auto-importada por Nuxt.

| Archivo | Propósito |
|---------|-----------|
| `useAuth.ts` | Stub de sesión. Google OAuth en Fase 3. |
| `useCart.ts` | Operaciones del carrito (wrapper Pinia) |
| `useProductImages.ts` | Resuelve URLs del CDN de imágenes |
| `useUtils.ts` | `formatPrice`, `formatStoreDate` (locale es-CO) |
| `useCatalog.ts` | Fetch catálogo API + fallback mocks (Fase 2) |

## Convención

Un composable por dominio. Sin lógica de negocio pesada — eso vive en `server/`.
