# API — Endpoints HTTP

Handlers Nitro en `server/api/`. Auto-enrutados por convención de archivos. Casi todos delegan en `proxyToLumiaApi()` hacia la API Lumia.

## Catálogo

| Archivo | Ruta | Descripción |
|---------|------|-------------|
| `products/index.get.ts` | `GET /api/products` | Listado (`page`, `limit`, `search`, `sort`, `promo`, `slugs`, …) |
| `products/[slug].get.ts` | `GET /api/products/:slug` | Detalle por slug |
| `products/[slug]/feedback.get.ts` | `GET /api/products/:slug/feedback` | Reseñas |
| `products/[slug]/feedback.post.ts` | `POST /api/products/:slug/feedback` | Crear reseña |
| `categories/index.get.ts` | `GET /api/categories` | Categorías |

## Tienda (settings públicos)

| Archivo | Ruta |
|---------|------|
| `store/banners.get.ts` | `GET /api/store/banners` |
| `store/shipping-settings.get.ts` | `GET /api/store/shipping-settings` |
| `store/currency-settings.get.ts` | `GET /api/store/currency-settings` |
| `store/customer-settings.get.ts` | `GET /api/store/customer-settings` |

## Auth (Google OAuth)

| Archivo | Ruta | Notas |
|---------|------|-------|
| `auth/google.get.ts` | `GET /api/auth/google` | Inicia OAuth (redirect) |
| `auth/google/callback.get.ts` | `GET /api/auth/google/callback` | Callback |
| `auth/me.get.ts` | `GET /api/auth/me` | Sesión actual (mapeada) |
| `auth/profile.patch.ts` | `PATCH /api/auth/profile` | Actualizar perfil |
| `auth/logout.post.ts` | `POST /api/auth/logout` | Cerrar sesión |
| `auth/logout-all.post.ts` | `POST /api/auth/logout-all` | Cerrar todas las sesiones |
| `auth/sessions/index.get.ts` | `GET /api/auth/sessions` | Listar sesiones |
| `auth/sessions/revoke.post.ts` | `POST /api/auth/sessions/revoke` | Revocar sesión |

## Cuenta

| Archivo | Ruta |
|---------|------|
| `account/favorites/index.get.ts` | `GET /api/account/favorites` |
| `account/favorites/toggle.post.ts` | `POST /api/account/favorites/toggle` |
| `account/favorites/sync.post.ts` | `POST /api/account/favorites/sync` |
| `account/preferences.patch.ts` | `PATCH /api/account/preferences` |

## Carrito y pedidos

| Archivo | Ruta |
|---------|------|
| `cart/index.get.ts` | `GET /api/cart` |
| `cart/index.delete.ts` | `DELETE /api/cart` |
| `cart/items.post.ts` | `POST /api/cart/items` |
| `cart/items.patch.ts` | `PATCH /api/cart/items` |
| `cart/items.delete.ts` | `DELETE /api/cart/items` |
| `orders/create.post.ts` | `POST /api/orders/create` |
| `orders/mine.get.ts` | `GET /api/orders/mine` |
| `orders/mine/[id].get.ts` | `GET /api/orders/mine/:id` |
| `orders/[id]/cancel.post.ts` | `POST /api/orders/:id/cancel` |
| `orders/[id]/cancel-request.post.ts` | `POST /api/orders/:id/cancel-request` |
| `payments/manual.post.ts` | `POST /api/payments/manual` |

## Notificaciones

| Archivo | Ruta |
|---------|------|
| `notifications/index.get.ts` | `GET /api/notifications` |
| `notifications/unread-count.get.ts` | `GET /api/notifications/unread-count` |
| `notifications/read.patch.ts` | `PATCH /api/notifications/read` |
| `notifications/read-all.patch.ts` | `PATCH /api/notifications/read-all` |
| `notifications/[id].delete.ts` | `DELETE /api/notifications/:id` |

## Sistema

| Archivo | Ruta |
|---------|------|
| `health.get.ts` | `GET /api/health` |
| `newsletter/subscribe.post.ts` | `POST /api/newsletter/subscribe` |
| `cdn/images.get.ts` | `GET /api/cdn/images` |

## Errores de login OAuth

El callback redirige a `/auth/login?error=LG_ERROR00X`. Definición compartida: `shared/auth/login-errors.ts`.
