# Database — MongoDB Atlas + D1 catálogo

## MongoDB (source of truth)

Conexiones al cluster M0 gratuito. Un cliente por base de datos, cacheado en el isolate del Worker.

| Archivo | Base | Variable de entorno |
|---------|------|---------------------|
| `connection.ts` | Utilidad genérica | — |
| `catalog.ts` | `catalog_db` | `NUXT_MONGO_CATALOG_URI` |
| `auth.ts` | `identity_db` | `NUXT_MONGO_AUTH_URI` |
| `sales.ts` | `sales_db` | `NUXT_MONGO_SALES_URI` |

## D1 catálogo (lectura edge)

| Archivo | Binding | Variable |
|---------|---------|----------|
| `catalog-d1.ts` | `CATALOG_DB` | `NUXT_CATALOG_SOURCE` |

### Fase 0 — setup

```bash
npm run db:d1:setup              # schema local + intenta crear base remota
npm run db:d1:migrate:remote     # schema en Cloudflare (tras db:d1:create)
npm run cf:types                 # genera tipos del binding
```

En el dashboard: **D1 → lumia-catalog → Settings → Enable Read Replication**.

### Fuente de lectura (`NUXT_CATALOG_SOURCE`)

| Valor | Comportamiento |
|-------|----------------|
| `mongo` | Solo MongoDB |
| `d1` | Solo D1 si el binding existe |
| `auto` | D1 si hay binding **y** productos sync; si no, Mongo |

Resolver: `server/utils/catalog-source.ts`.

## Workers + MongoDB

Requiere en `wrangler.jsonc`:

```jsonc
"compatibility_flags": ["nodejs_compat"]
```

El driver usa TCP (`node:net`, `node:tls`). En cold starts la primera conexión puede tardar ~300ms.
