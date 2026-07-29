import { DEFAULT_PRODUCT_IMAGES_CDN_BASE } from './constants'
import { collapseDoubleSlash, ensureLeadingSlash, hasImageFileExtension, isHttpUrl, sanitizeSlugForPath } from './normalize'
import type { GalleryLayoutMode, ProductImageFormat, ProductImageVariantKey } from './types'

export function normalizeCdnBase(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '')
}

/** `presentation_view` en PDP → mismo archivo que `big` en repo. */
export function fileKeyFromVariant(variant: ProductImageVariantKey): string {
  return variant === 'presentation_view' ? 'big' : variant
}

export function buildProductVariantUrl(
  slug: string,
  variant: ProductImageVariantKey,
  options?: {
    baseUrl?: string
    format?: ProductImageFormat
  }
): string {
  const base = normalizeCdnBase(options?.baseUrl ?? DEFAULT_PRODUCT_IMAGES_CDN_BASE)
  const s = sanitizeSlugForPath(slug)
  if (!s) return ''
  const key = fileKeyFromVariant(variant)
  const format = options?.format ?? 'avif'
  return `${base}/${encodeURIComponent(s)}/${encodeURIComponent(s)}-${encodeURIComponent(key)}.${format}`
}

export function buildGalleryVariantUrl(
  slug: string,
  galleryIndex: number,
  variant: ProductImageVariantKey,
  options?: {
    baseUrl?: string
    format?: ProductImageFormat
    layout?: GalleryLayoutMode
  }
): string {
  const base = normalizeCdnBase(options?.baseUrl ?? DEFAULT_PRODUCT_IMAGES_CDN_BASE)
  const s = sanitizeSlugForPath(slug)
  if (!s || galleryIndex < 1) return ''
  const key = fileKeyFromVariant(variant)
  const format = options?.format ?? 'avif'
  const layout = options?.layout ?? 'flat'
  const filename = `${s}-gallery-${galleryIndex}-${key}.${format}`
  if (layout === 'nested') {
    return `${base}/${encodeURIComponent(s)}/gallery/${encodeURIComponent(filename)}`
  }
  return `${base}/${encodeURIComponent(s)}/${encodeURIComponent(filename)}`
}

export function buildProductSrcSet(
  slug: string,
  variants: ProductImageVariantKey[],
  widths: number[],
  options?: { baseUrl?: string; format?: ProductImageFormat }
): string {
  const parts: string[] = []
  const seen = new Set<string>()
  variants.forEach((v, i) => {
    const url = buildProductVariantUrl(slug, v, { baseUrl: options?.baseUrl, format: options?.format })
    if (!url || seen.has(url)) return
    seen.add(url)
    const w = widths[i] ?? widths[Math.min(i, widths.length - 1)] ?? 600
    parts.push(`${url} ${w}w`)
  })
  return parts.join(', ')
}

export function resolveProductImageSrcForVariant(
  slug: string,
  imagePath: string,
  variant: ProductImageVariantKey,
  baseUrl: string = DEFAULT_PRODUCT_IMAGES_CDN_BASE
): string {
  const base = normalizeCdnBase(baseUrl)
  const p = imagePath.trim()
  const s = sanitizeSlugForPath(slug)

  if (!s && !p) return ''
  if (!s && p && isHttpUrl(p) && hasImageFileExtension(p)) return collapseDoubleSlash(p)

  if (!s) return ''

  if (!p) {
    return buildProductVariantUrl(s, variant, { baseUrl: base })
  }

  if (isHttpUrl(p)) {
    if (hasImageFileExtension(p)) return collapseDoubleSlash(p)

    if (/github\.com\//i.test(p) && /\/(tree|blob)\//i.test(p)) {
      return buildProductVariantUrl(s, variant, { baseUrl: base })
    }

    if (/raw\.githubusercontent\.com/i.test(p)) {
      const noQuery = (p.split('?')[0] ?? '').replace(/\/$/, '')
      if (hasImageFileExtension(noQuery)) return p
      const key = fileKeyFromVariant(variant)
      return `${noQuery}/${encodeURIComponent(s)}-${encodeURIComponent(key)}.avif`
    }

    return p
  }

  let local = ensureLeadingSlash(p)
  local = local.replace(/\/$/, '')
  if (hasImageFileExtension(local)) {
    return `${base}${local}`
  }

  if (local === '/products' || local.startsWith('/products/')) {
    return buildProductVariantUrl(s, variant, { baseUrl: base })
  }

  const key = fileKeyFromVariant(variant)
  return `${local}/${s}-${key}.avif`
}

export function resolveProductImagePreviewSrc(
  slug: string,
  imagePath: string,
  baseUrl: string = DEFAULT_PRODUCT_IMAGES_CDN_BASE
): string {
  return resolveProductImageSrcForVariant(slug, imagePath, 'small', baseUrl)
}
