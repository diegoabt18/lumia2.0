/**
 * Índices recomendados en MongoDB Atlas para catálogo, carrito y checkout.
 * Ejecutar una vez: node scripts/ensure-atlas-indexes.mjs
 *
 * Variables:
 * - NUXT_MONGO_CATALOG_URI o CATALOG_MONGODB_URI o MONGODB_URI → catalog_db
 * - NUXT_MONGO_SALES_URI o SALES_MONGODB_URI → sales_db (opcional)
 */
import { MongoClient } from 'mongodb'

function dbNameFromUri(u, fallback) {
  try {
    const pathname = new URL(u.replace('mongodb+srv://', 'https://')).pathname
    const name = pathname.replace(/^\//, '').split('?')[0]
    return name || fallback
  } catch {
    return fallback
  }
}

async function ensureIndexes(client, uri, fallbackDb, specs) {
  const db = client.db(dbNameFromUri(uri, fallbackDb))
  for (const spec of specs) {
    const result = await db.collection(spec.collection).createIndex(spec.key, {
      name: spec.name,
      ...(spec.options ?? {}),
    })
    console.log(`✓ ${fallbackDb}.${spec.collection}.${spec.name} → ${result}`)
  }
}

const catalogUri =
  process.env.NUXT_MONGO_CATALOG_URI ||
  process.env.CATALOG_MONGODB_URI ||
  process.env.MONGODB_URI
const salesUri = process.env.NUXT_MONGO_SALES_URI || process.env.SALES_MONGODB_URI

if (!catalogUri && !salesUri) {
  console.error('Define NUXT_MONGO_CATALOG_URI y/o NUXT_MONGO_SALES_URI')
  process.exit(1)
}

const catalogSpecs = [
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
    collection: 'inventory_items',
    key: { sku: 1 },
    name: 'inventory_items_sku',
  },
]

const salesSpecs = [
  {
    collection: 'carts',
    key: { userId: 1 },
    name: 'carts_userId',
    options: { unique: true },
  },
  {
    collection: 'order_idempotency',
    key: { expiresAt: 1 },
    name: 'order_idempotency_ttl',
    options: { expireAfterSeconds: 0 },
  },
  {
    collection: 'orders',
    key: { orderNumber: 1 },
    name: 'orders_orderNumber',
    options: { unique: true },
  },
]

const uris = [...new Set([catalogUri, salesUri].filter(Boolean))]
const client = new MongoClient(uris[0])

try {
  await client.connect()

  if (catalogUri) {
    console.log('\nCatálogo:')
    await ensureIndexes(client, catalogUri, 'catalog_db', catalogSpecs)
  }

  if (salesUri && salesUri !== catalogUri) {
    const salesClient = new MongoClient(salesUri)
    try {
      await salesClient.connect()
      console.log('\nSales:')
      await ensureIndexes(salesClient, salesUri, 'sales_db', salesSpecs)
    } finally {
      await salesClient.close().catch(() => {})
    }
  } else if (salesUri) {
    console.log('\nSales (mismo cluster):')
    await ensureIndexes(client, salesUri, 'sales_db', salesSpecs)
  }

  console.log('\nÍndices listos.')
} finally {
  await client.close().catch(() => {})
}
