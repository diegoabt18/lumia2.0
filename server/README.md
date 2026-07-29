# Server — API Nitro

Backend serverless desplegado como Cloudflare Worker (preset `cloudflare_module`).

## Arquitectura

```
server/
├── api/              → Endpoints HTTP (H3 event handlers)
├── database/         → Conexiones MongoDB Atlas
└── core/catalog/     → Repositorios y mappers (Clean Architecture lite)
```

## Principios

- Toda lógica de negocio en `server/core/`
- Toda consulta a MongoDB en repositorios
- Sin Prisma — driver nativo `mongodb` + `nodejs_compat`
- Compatible con el esquema del proyecto `lumia` (mismas colecciones)

## Bases de datos (1 cluster M0, 4 DB lógicas)

| Variable | Base | Uso en tienda pública |
|----------|------|------------------------|
| `NUXT_MONGO_CATALOG_URI` | `catalog_db` | Productos, variantes, promociones |
| `NUXT_MONGO_SALES_URI` | `sales_db` | Carrito, órdenes (Fase 3) |
| `NUXT_MONGO_AUTH_URI` | `identity_db` | Usuarios, sesiones (Fase 3) |

## Endpoints (Fase 2)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servicio y MongoDB |
| GET | `/api/products` | Listado paginado |
| GET | `/api/products/:slug` | Detalle por slug |

## Desarrollo local

Configura `.env`:

```
NUXT_MONGO_CATALOG_URI=mongodb+srv://...
```

Sin URI → la API responde 503 y el frontend usa mocks.
