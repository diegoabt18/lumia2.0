/**
 * Sube secretos de `.env` a Cloudflare Workers con `wrangler secret put`.
 *
 * Uso:
 *   node scripts/cf-push-secrets.mjs
 *   node scripts/cf-push-secrets.mjs --env production
 *   node scripts/cf-push-secrets.mjs --dry-run
 */
import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SECRET_KEYS = [
  'NUXT_JWT_SECRET',
  'NUXT_JWT_REFRESH_SECRET',
  'NUXT_GOOGLE_CLIENT_ID',
  'NUXT_GOOGLE_CLIENT_SECRET',
  'NUXT_MONGO_AUTH_URI',
  'NUXT_MONGO_CATALOG_URI',
  'NUXT_MONGO_SALES_URI',
  'NUXT_RESEND_API_KEY',
  'NUXT_RESEND_FROM',
  'NUXT_ORDER_NOTIFY_EMAIL',
  'NUXT_TURNSTILE_SECRET_KEY',
  'NUXT_PUBLIC_TURNSTILE_SITE_KEY',
  'NUXT_MP_ACCESS_TOKEN',
  'NUXT_MP_WEBHOOK_SECRET',
  'NUXT_PUBLIC_MP_PUBLIC_KEY',
  'NUXT_PUBLIC_WHATSAPP_PHONE',
  'NUXT_PUBLIC_PRODUCT_IMAGES_CDN_BASE',
]

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env')
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const envFlagIndex = args.indexOf('--env')
const wranglerEnv = envFlagIndex >= 0 ? args[envFlagIndex + 1] : undefined

if (!existsSync(envPath)) {
  console.error('No se encontró .env en la raíz del proyecto.')
  process.exit(1)
}

function parseEnv(content) {
  const map = new Map()
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    map.set(key, value)
  }
  return map
}

const env = parseEnv(readFileSync(envPath, 'utf8'))
const missing = SECRET_KEYS.filter((k) => !env.get(k)?.trim())

if (missing.length) {
  console.warn('Claves vacías o ausentes en .env (se omitirán):')
  for (const k of missing) console.warn(`  - ${k}`)
}

const toPush = SECRET_KEYS.filter((k) => env.get(k)?.trim())
if (!toPush.length) {
  console.error('No hay secretos con valor en .env para subir.')
  process.exit(1)
}

console.log(
  dryRun
    ? `[dry-run] Se subirían ${toPush.length} secretos${wranglerEnv ? ` (--env ${wranglerEnv})` : ''}:`
    : `Subiendo ${toPush.length} secretos${wranglerEnv ? ` (--env ${wranglerEnv})` : ''}...`
)

for (const key of toPush) {
  const value = env.get(key)
  if (dryRun) {
    console.log(`  ${key} (${value.length} chars)`)
    continue
  }

  const wranglerArgs = ['wrangler', 'secret', 'put', key]
  if (wranglerEnv) wranglerArgs.push('--env', wranglerEnv)

  const result = spawnSync('npx', wranglerArgs, {
    cwd: root,
    input: value,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  })

  if (result.status !== 0) {
    console.error(`Error al subir ${key}`)
    process.exit(result.status ?? 1)
  }
}

if (!dryRun) console.log('Secretos actualizados en Cloudflare.')
