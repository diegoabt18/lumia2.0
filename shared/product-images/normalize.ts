/** Evita dobles barras excepto tras `https://`. */
export function collapseDoubleSlash(input: string): string {
  const t = input.trim()
  if (!t) return ''
  return t.replace(/([^:])\/{2,}/g, '$1/')
}

export function ensureLeadingSlash(localPath: string): string {
  const t = localPath.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return collapseDoubleSlash(t)
  return collapseDoubleSlash('/' + t.replace(/^\/+/, ''))
}

export function sanitizeSlugForPath(slug: string): string {
  return slug.trim().toLowerCase()
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

export function hasImageFileExtension(pathOrUrl: string): boolean {
  const clean = (pathOrUrl.split('?')[0] ?? '').trim()
  return /\.(avif|webp|jpe?g|png|gif)(\/?$|[?#])/i.test(clean) || /\.(avif|webp|jpe?g|png|gif)$/i.test(clean)
}
