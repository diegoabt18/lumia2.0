-- Lumia catalog read layer (D1)
-- Fase 0: esquema denormalizado para lecturas de catálogo en edge.
-- Fuente de verdad operativa: MongoDB catalog_db (sync en fases posteriores).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY NOT NULL,
  mongo_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category_slug TEXT,
  brand TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  image_path TEXT,
  sales_total_units INTEGER NOT NULL DEFAULT 0,
  average_rating REAL,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS variants (
  sku TEXT PRIMARY KEY NOT NULL,
  product_slug TEXT NOT NULL,
  price REAL NOT NULL,
  compare_at_price REAL,
  currency TEXT NOT NULL DEFAULT 'COP',
  options_json TEXT,
  image_path TEXT,
  stock INTEGER,
  available INTEGER,
  is_per_order INTEGER NOT NULL DEFAULT 0,
  option_rules_json TEXT,
  option_value_ids_json TEXT,
  synced_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_slug) REFERENCES products(slug) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  product_count INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  rules_json TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_option_axes (
  id TEXT PRIMARY KEY NOT NULL,
  product_slug TEXT NOT NULL,
  product_mongo_id TEXT,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_slug) REFERENCES products(slug) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_option_values (
  id TEXT PRIMARY KEY NOT NULL,
  axis_id TEXT NOT NULL,
  value TEXT NOT NULL,
  slug TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (axis_id) REFERENCES product_option_axes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_options_legacy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  values_json TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_slug) REFERENCES products(slug) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS migration_logs (
  id TEXT PRIMARY KEY NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL,
  rows_read INTEGER NOT NULL DEFAULT 0,
  rows_written INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  error TEXT,
  triggered_by TEXT
);

CREATE TABLE IF NOT EXISTS migration_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_status_created
  ON products(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_category_status
  ON products(category_slug, status);

CREATE INDEX IF NOT EXISTS idx_variants_product_price
  ON variants(product_slug, price);

CREATE INDEX IF NOT EXISTS idx_promotions_active_window
  ON promotions(active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_option_axes_product
  ON product_option_axes(product_slug, position);

CREATE INDEX IF NOT EXISTS idx_option_values_axis
  ON product_option_values(axis_id, position);

CREATE INDEX IF NOT EXISTS idx_options_legacy_product
  ON product_options_legacy(product_slug);

INSERT OR IGNORE INTO migration_meta (key, value, updated_at)
VALUES ('schema_version', '001', datetime('now'));
