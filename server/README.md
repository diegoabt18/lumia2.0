# Server — Proxy Nitro

Este proyecto ya no persiste datos ni ejecuta lógica de negocio localmente. Los handlers en `server/api/` reenvían las peticiones a la **API Lumia externa** (`NUXT_API_BASE_URL`) mediante `server/utils/lumia-api-client.ts`.

## Arquitectura

```
server/
├── api/              → Endpoints HTTP (proxy hacia API Lumia)
└── utils/
    └── lumia-api-client.ts  → fetch, cookies, mapeo de respuestas
```

## Comportamiento del proxy

- Reenvía método, query string y body tal cual.
- Propaga cookies de sesión (`cookie` / `set-cookie`) para auth Google OAuth.
- Copia headers relevantes: `Authorization`, `Content-Type`, `Idempotency-Key`.
- OAuth: redirige respuestas 3xx de Google callback sin modificar.

Algunos endpoints transforman la respuesta antes de devolverla al cliente, por ejemplo `GET /api/auth/me` (mapeo de usuario).

## Variables requeridas

| Variable | Descripción |
|----------|-------------|
| `NUXT_API_BASE_URL` | URL base de la API Lumia |

Sin esta variable → **503** con mensaje `"NUXT_API_BASE_URL no configurada"`.

En Cloudflare Workers la variable puede venir de `wrangler.jsonc` o del binding `__env__`; el cliente incluye fallback para ambos casos.

## Desarrollo local

Con `npm run dev`, configura `.env`:

```
NUXT_API_BASE_URL=https://api.lumiadalistore.com
NUXT_SITE_URL=http://localhost:3000
```

Con `npm run cf:dev`, usa `.dev.vars` (copia de `.dev.vars.example`).

## Health

`GET /api/health` — proxy al health check de la API remota.
