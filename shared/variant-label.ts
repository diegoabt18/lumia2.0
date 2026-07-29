/** Etiqueta legible de variante (ej. "200g · Lavanda") a partir de `options` o SKU. */
export function formatVariantLabel(options?: Record<string, string> | null, sku?: string): string {
  const parts = Object.values(options ?? {})
    .map((v) => v?.trim())
    .filter(Boolean)
  if (parts.length) return parts.join(' · ')
  return sku?.trim() ?? ''
}
