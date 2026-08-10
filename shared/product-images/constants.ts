import { resolveProductImagesCdnBase } from '../image-cdn'
import type { GalleryLayoutMode } from './types'

/**
 * Base CDN de productos por defecto (`{IMAGE_CDN_URL}/products`).
 * Sobreescribible con runtimeConfig.
 */
export const DEFAULT_PRODUCT_IMAGES_CDN_BASE = resolveProductImagesCdnBase()

export const DEFAULT_GALLERY_LAYOUT: GalleryLayoutMode = 'flat'
