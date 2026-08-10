import { DEFAULT_IMAGE_CDN_URL, IMAGE_CDN_NAMESPACES } from './constants'
import type { ImageOutputFormat } from './presets'

export function normalizeCdnUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '')
}

export function resolveImageCdnUrl(override?: string | null): string {
  const fromOverride = typeof override === 'string' ? override.trim() : ''
  if (fromOverride) return normalizeCdnUrl(fromOverride)
  return normalizeCdnUrl(DEFAULT_IMAGE_CDN_URL)
}

/** Base de productos: `{IMAGE_CDN_URL}/products`. */
export function resolveProductImagesCdnBase(options?: { imageCdnUrl?: string | null }): string {
  return `${resolveImageCdnUrl(options?.imageCdnUrl)}/${IMAGE_CDN_NAMESPACES.products}`
}

export function buildCdnAssetUrl(
  imageKey: string,
  filename: string,
  options?: { cdnUrl?: string | null }
): string {
  const base = resolveImageCdnUrl(options?.cdnUrl)
  const key = imageKey.trim().replace(/^\/+|\/+$/g, '')
  const file = filename.trim().replace(/^\/+/, '')
  if (!key || !file) return ''
  return `${base}/${key.split('/').map(encodeURIComponent).join('/')}/${encodeURIComponent(file)}`
}

export function swapImageFormat(url: string, format: ImageOutputFormat): string {
  return url.replace(/\.(avif|webp)(\?.*)?$/i, `.${format}$2`)
}

export function buildProductImageKey(slug: string): string {
  const s = slug.trim().toLowerCase()
  return s ? `${IMAGE_CDN_NAMESPACES.products}/${s}` : ''
}
