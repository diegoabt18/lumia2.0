# Lumia 2.0

Tienda pública de velas artesanales. Serverless sobre **Cloudflare Workers** + **Nuxt 4**.

El panel de administración vive en el proyecto `lumia` (local, no desplegado).

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Nuxt 4, Vue 3, TypeScript, Tailwind 3 |
| Backend | Nitro (H3) en Cloudflare Workers |
| Base de datos | MongoDB Atlas (catálogo/ventas) + D1 (lectura edge, Fase 0+) |
| Imágenes | GitHub + jsDelivr CDN |
| Deploy | `wrangler deploy` |

## Inicio rápido

```bash
# Requiere Node >= 24.11
npm install
cp .env.example .env   # configurar MONGO_CATALOG_URI, etc.
npm run db:d1:migrate  # schema D1 local (requerido para panel admin)
npm run dev            # http://localhost:3000
```

## Estructura

```
app/           → UI, páginas, composables, features
server/        → API Nitro, repositorios, conexión MongoDB
shared/        → tipos, mocks, design system, utilidades
docs/          → documentación del proyecto
```

## Documentación por módulo

Cada carpeta tiene su `README.md`:

- `app/components/ui/` — botones, contenedores
- `app/components/layout/` — navbar, footer, carrito
- `app/components/home/` — bloques de la home
- `app/components/product/` — tarjetas y galería
- `app/features/shell/` — layout público
- `app/features/cart/` — estado del carrito
- `server/` — API y persistencia
- `shared/design-system/` — tokens de diseño

## Sistema de diseño

- Referencia visual: **`/design-system`**
- Markdown: `docs/DESIGN_SYSTEM.md`
- Tokens: `shared/design-system/tokens.ts`

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo local |
| `npm run build` | Build producción (Cloudflare) |
| `npm run cf:deploy` | Build + deploy a Workers |
| `npm run cf:dev` | Preview con Wrangler |
| `npm run db:d1:setup` | Schema D1 local + guía para base remota |
| `npm run db:d1:migrate:remote` | Schema D1 en Cloudflare (tras crear la base) |

### Catálogo D1 (Fase 0)

```bash
npm run db:d1:setup              # aplica 001_catalog_schema.sql en local
npm run db:d1:create             # crea lumia-catalog en Cloudflare (pega database_id en wrangler.jsonc)
npm run db:d1:migrate:remote     # schema remoto (una vez)
npm run cf:deploy:prod           # incluye binding CATALOG_DB en applumia2
# Dashboard → D1 → lumia-catalog → Enable Read Replication
```

Variable `NUXT_CATALOG_SOURCE`: `mongo` (default) | `d1` | `auto`. Ver `server/database/README.md`.

### Panel admin (Fase 3)

Ruta `/admin/migration` (rol `admin` en sesión). Sync Mongo → D1 desde la UI.

### Lectura catálogo (Fase 2)

Endpoints públicos usan `server/core/catalog/application/catalog-reader.ts`:

- `GET /api/products`, `/api/products/:slug`, `/api/categories`, sitemap
- Modo `auto`: D1 si hay binding + datos sync; si no, Mongo
- Carrito/stock sigue en Mongo
