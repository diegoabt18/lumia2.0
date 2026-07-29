/**
 * Índices recomendados en MongoDB Atlas para acelerar catálogo y carrito.
 * Ejecutar una vez: node scripts/ensure-atlas-indexes.mjs
 *
 * Requiere MONGODB_URI (o CATALOG_MONGODB_URI) en el entorno.
 */
import { MongoClient } from 'mongodb'

const uri = process.env.CATALOG_MONGODB_URI || process.env.MONGODB_URI
if (!uri) {
  console.error('Define MONGODB_URI o CATALOG_MONGODB_URI')
  process.exit(1)
}

function dbNameFromUri(u) {
  try {
    const pathname = new URL(u.replace('mongodb+srv://', 'https://')).pathname
    const name = pathname.replace(/^\//, '').split('?')[0]
    return name || 'lumia'
  } catch {
    return 'lumia'
  }
}

const client = new MongoClient(uri)

try {
  await client.connect()
  const db = client.db(dbNameFromUri(uri))

  const specs = [
    {
      collection: 'products',
      key: { status: 1, category_slug: 1, created_at: -1 },
      name: 'products_catalog_list',
    },
    {
      collection: 'products',
      key: { slug: 1 },
      name: 'products_slug',
      options: { unique: true },
    },
    {
      collection: 'variants',
      key: { product_slug: 1, price: 1 },
      name: 'variants_by_product_price',
    },
    {
      collection: 'variants',
      key: { sku: 1 },
      name: 'variants_sku',
      options: { unique: true },
    },
    {
      collection: 'carts',
      key: { session_id: 1 },
      name: 'carts_session',
      options: { unique: true, sparse: true },
    },
  ]

  for (const spec of specs) {
    const result = await db.collection(spec.collection).createIndex(spec.key, {
      name: spec.name,
      ...(spec.options ?? {}),
    })
    console.log(`✓ ${spec.collection}.${spec.name} → ${result}`)
  }

  console.log('\nÍndices listos. El catálogo debería responder mucho más rápido.')
} finally {
  await client.close().catch(() => {})
}
