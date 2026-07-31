# Lumia 2.0

Tienda pública de velas artesanales. Frontend **Nuxt 4** desplegado en **Cloudflare Workers** que actúa como proxy hacia la API Lumia (`NUXT_API_BASE_URL`).

El panel de administración y la lógica de negocio viven en el proyecto backend `server` (Fastify + MongoDB), no en este repo.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Nuxt 4, Vue 3, TypeScript, Tailwind 3 |
| Runtime | Nitro en Cloudflare Workers |
| Backend | API externa Lumia (proxy transparente) |
| Imágenes | GitHub + jsDelivr CDN |
| Deploy | `wrangler deploy` |

## Inicio rápido

```bash
# Requiere Node >= 24.11
npm install
cp .env.example .env   # configurar NUXT_API_BASE_URL, NUXT_SITE_URL
npm run dev            # http://localhost:3000
```

Para probar el build de Workers localmente:

```bash
cp .dev.vars.example .dev.vars
npm run cf:dev         # http://localhost:8787
```

## Estructura

```
app/           → UI, páginas, composables, features
server/        → Proxy Nitro hacia la API Lumia
shared/        → tipos, mocks, design system, utilidades
docs/          → documentación del proyecto
```

## Variables de entorno

Ver `.env.example`. Las imprescindibles:

| Variable | Uso |
|----------|-----|
| `NUXT_SITE_URL` | URL canónica del sitio (SEO, cookies OAuth) |
| `NUXT_API_BASE_URL` | Base de la API Lumia (`https://api.lumiadalistore.com`) |

En producción, `NUXT_API_BASE_URL` va en `wrangler.jsonc` bajo `env.production.vars`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo local (Nuxt) |
| `npm run build` | Build producción (Cloudflare) |
| `npm run cf:deploy` | Build + deploy a Workers |
| `npm run cf:deploy:prod` | Deploy al entorno `production` |
| `npm run cf:dev` | Preview con Wrangler |
| `npm run cf:secrets:prod` | Sube secretos opcionales desde `.env` |

## Documentación por módulo

Cada carpeta tiene su `README.md`:

- `app/components/ui/` — botones, contenedores
- `app/components/layout/` — navbar, footer, carrito
- `app/components/home/` — bloques de la home
- `app/components/product/` — tarjetas y galería
- `app/features/shell/` — layout público
- `app/features/cart/` — estado del carrito
- `server/` — proxy API
- `shared/design-system/` — tokens de diseño

## Sistema de diseño

- Referencia visual: **`/design-system`**
- Markdown: `docs/DESIGN_SYSTEM.md`
- Tokens: `shared/design-system/tokens.ts`
