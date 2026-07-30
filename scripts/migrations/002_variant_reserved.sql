-- Lumia catalog D1 — stock operativo en edge
-- 002: reservas de checkout (no se pisan en sync Mongo → D1)

ALTER TABLE variants ADD COLUMN reserved INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_variants_sellable
  ON variants(product_slug, is_per_order);

UPDATE migration_meta
SET value = '002', updated_at = datetime('now')
WHERE key = 'schema_version';

INSERT OR IGNORE INTO migration_meta (key, value, updated_at)
VALUES ('schema_version', '002', datetime('now'));
