# API — Endpoints HTTP

Handlers Nitro en `server/api/`. Auto-enrutados por convención de archivos.

## Catálogo

| Archivo | Ruta | Descripción |
|---------|------|-------------|
| `products/index.get.ts` | `GET /api/products` | Listado paginado (`?page=&limit=&search=`) |
| `products/[slug].get.ts` | `GET /api/products/:slug` | Detalle por slug |

## Sistema

| Archivo | Ruta | Descripción |
|---------|------|-------------|
| `health.get.ts` | `GET /api/health` | Ping + estado MongoDB |

## Respuestas

Listado exitoso:

```json
{
  "products": [...],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 },
  "source": "mongodb"
}
```

Sin `MONGO_CATALOG_URI` → **503** y el frontend usa mocks vía `useCatalog()`.
