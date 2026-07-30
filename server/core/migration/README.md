# Migración Mongo → D1 (catálogo)

Sincroniza entidades read-only de `catalog_db` hacia D1 para lecturas en edge.

## Targets

| Target | Contenido |
|--------|-----------|
| `categories` | Categorías + conteo de productos |
| `products` | Productos |
| `variants` | Variantes (requiere productos en D1) |
| `promotions` | Promociones |
| `options` | Ejes, valores y opciones legacy (requiere productos) |
| `full` | Todos en orden de dependencias |

## APIs admin (requieren sesión `role: admin`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/migration/status` | Estado Mongo/D1, conteos, último sync |
| GET | `/api/admin/migration/history` | Historial de syncs |
| GET | `/api/admin/migration/logs` | Logs (alias history) |
| GET | `/api/admin/migration/logs/:id` | Detalle de un log |
| POST | `/api/admin/migration/dry-run` | Simula sync `{ "target": "full" }` |
| POST | `/api/admin/migration/full` | Sync completa |
| POST | `/api/admin/migration/:target` | Sync parcial |

## Ejemplo

```bash
# Con cf:dev y cookie de admin
curl -X POST http://localhost:8787/api/admin/migration/dry-run \
  -H "Content-Type: application/json" \
  -H "Cookie: lumia_session=..." \
  -d '{"target":"full"}'
```

Promover admin: `identity_db.users.role = 'admin'` en MongoDB.

## UI admin

Ruta: `/admin/migration` (middleware `admin`, layout `admin`).

## Fase 4 — cutover y cron

| Paso | Acción |
|------|--------|
| 1 | Schema remoto: `npm run db:d1:migrate:remote` |
| 2 | Binding D1 en `env.production` + deploy |
| 3 | Sync manual desde panel o cron |
| 4 | Confirmar **Fuente activa: D1** con `NUXT_CATALOG_SOURCE=auto` |

**Stock:** la sync de `variants` incluye cantidades desde Mongo `inventory_items` (no es una tabla D1 aparte). Tras cambios de inventario en lumia, vuelve a sincronizar `variants` o `full`.

### Cron sync

`POST /api/cron/sync-catalog` — sync completa protegida por `NUXT_CRON_SECRET`.

- Omite si ya hay un log `running`
- Invalida caché in-memory del catálogo tras sync exitosa
- `triggeredBy: cron` en `migration_logs`

```bash
curl -X POST https://tu-dominio/api/cron/sync-catalog \
  -H "Authorization: Bearer $NUXT_CRON_SECRET"
```

