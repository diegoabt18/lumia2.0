import type { GalleryLayoutMode } from './types'

/**
 * Raw GitHub por defecto (`lumia_images`).
 * Sobreescribible con `runtimeConfig.public.productImagesCdnBase`.
 */
export const DEFAULT_PRODUCT_IMAGES_CDN_BASE =
  'https://raw.githubusercontent.com/lumiadali/lumia_images/refs/heads/main/products'

/** Por defecto las galerías del estudio están en la misma carpeta que el principal (`flat`). */
export const DEFAULT_GALLERY_LAYOUT: GalleryLayoutMode = 'flat'
