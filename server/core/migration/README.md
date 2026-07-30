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

