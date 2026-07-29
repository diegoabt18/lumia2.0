# Database — MongoDB Atlas

Conexiones al cluster M0 gratuito. Un cliente por base de datos, cacheado en el isolate del Worker.

## Archivos

| Archivo | Base | Variable de entorno |
|---------|------|---------------------|
| `connection.ts` | Utilidad genérica | — |
| `catalog.ts` | `catalog_db` | `NUXT_MONGO_CATALOG_URI` |

## Workers + MongoDB

Requiere en `wrangler.jsonc`:

```jsonc
"compatibility_flags": ["nodejs_compat"]
```

El driver usa TCP (`node:net`, `node:tls`). En cold starts la primera conexión puede tardar ~300ms.

## Atlas

- Network Access: `0.0.0.0/0` (Workers no tienen IP fija)
- Usuario con permisos mínimos solo en `catalog_db`

## Reconexión

Si el ping falla (topology closed), el cliente se cierra y reconecta automáticamente.
