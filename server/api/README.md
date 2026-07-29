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

## Auth (Google OAuth)

| Archivo | Ruta | Descripción |
|---------|------|-------------|
| `auth/google.get.ts` | `GET /api/auth/google` | Inicia flujo OAuth |
| `auth/google/callback.get.ts` | `GET /api/auth/google/callback` | Callback de Google |
| `auth/me.get.ts` | `GET /api/auth/me` | Sesión actual |
| `auth/logout.post.ts` | `POST /api/auth/logout` | Cierra sesión |

### Códigos de error de login (cliente)

El callback redirige a `/auth/login?error=LG_ERROR00X`. El mensaje en UI es genérico (toast); el detalle técnico queda en logs (`[oauth]`).

| Código | Causa interna (servidor) |
|--------|---------------------------|
| `LG_ERROR001` | `oauth_state` — cookie/state CSRF expiró o no coincide (www/apex, sesión caducada) |
| `LG_ERROR002` | `google_config` — faltan `NUXT_GOOGLE_*` o `NUXT_JWT_SECRET` |
| `LG_ERROR003` | `auth_db` — falta o no conecta `NUXT_MONGO_AUTH_URI` |
| `LG_ERROR004` | `google_token` — falló intercambio code→token con Google |
| `LG_ERROR005` | `google_user` — id_token inválido o sin email |
| `LG_ERROR006` | `oauth_server` — excepción no controlada (p. ej. upsert usuario en Mongo) |
| `LG_ERROR000` | Desconocido |

Definición compartida: `shared/auth/login-errors.ts`.
