#!/usr/bin/env node
/**
 * Fase 0 — preparación D1 catálogo.
 *
 * 1. Aplica el schema en D1 local (sin cuenta Cloudflare).
 * 2. Muestra pasos para crear la base remota y habilitar read replication.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const wranglerPath = path.join(root, 'wrangler.jsonc')
const schemaPath = path.join(root, 'scripts/migrations/001_catalog_schema.sql')

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function updateWranglerDatabaseId(databaseId) {
  const raw = readFileSync(wranglerPath, 'utf8')
  const next = raw.replace(/"database_id"\s*:\s*"[^"]+"/, `"database_id": "${databaseId}"`)
  if (next === raw) {
    console.warn('[db:d1:setup] No se encontró database_id en wrangler.jsonc — actualízalo manualmente.')
    return
  }
  writeFileSync(wranglerPath, next, 'utf8')
  console.log(`[db:d1:setup] wrangler.jsonc actualizado con database_id=${databaseId}`)
}

console.log('== Lumia D1 catalog — Fase 0 ==\n')

console.log('→ Aplicando schema local (001_catalog_schema.sql)...')
run('npx', ['wrangler', 'd1', 'execute', 'lumia-catalog', '--local', '--file', schemaPath])

const create = spawnSync(
  'npx',
  ['wrangler', 'd1', 'create', 'lumia-catalog'],
  { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' }
)

if (create.status === 0) {
  const match = create.stdout.match(/database_id = "([^"]+)"/)
  if (match?.[1]) updateWranglerDatabaseId(match[1])
  console.log('\n✓ Base remota lumia-catalog creada.')
} else {
  console.log('\nℹ Creación remota omitida (¿ya existe o sin sesión wrangler?).')
  console.log('  Ejecuta manualmente: npm run db:d1:create')
  console.log('  Luego pega el database_id en wrangler.jsonc → d1_databases[0].database_id')
}

console.log(`
Próximos pasos manuales:
  1. npm run db:d1:migrate:remote     # schema en Cloudflare
  2. Dashboard → D1 → lumia-catalog → Settings → Enable Read Replication
  3. npm run cf:types                 # tipos del binding CATALOG_DB
  4. Cuando el sync esté listo (Fase 1+): NUXT_CATALOG_SOURCE=auto o d1
`)
