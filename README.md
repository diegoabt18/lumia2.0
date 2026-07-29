# Lumia 2.0

Tienda pública de velas artesanales. Serverless sobre **Cloudflare Workers** + **Nuxt 4**.

El panel de administración vive en el proyecto `lumia` (local, no desplegado).

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Nuxt 4, Vue 3, TypeScript, Tailwind 3 |
| Backend | Nitro (H3) en Cloudflare Workers |
| Base de datos | MongoDB Atlas (driver nativo, sin Prisma) |
| Imágenes | GitHub + jsDelivr CDN |
| Deploy | `wrangler deploy` |

## Inicio rápido

```bash
# Requiere Node >= 24.11
npm install
cp .env.example .env   # configurar MONGO_CATALOG_URI, etc.
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
