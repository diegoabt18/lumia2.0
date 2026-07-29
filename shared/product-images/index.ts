export type {
  GalleryLayoutMode,
  ProductImageFormat,
  ProductImageRole,
  ProductImageVariantKey,
  ProductImageVariantSpec,
  ResponsiveImageCandidate,
  ResponsiveImageSet,
} from './types'

export { DEFAULT_GALLERY_LAYOUT, DEFAULT_PRODUCT_IMAGES_CDN_BASE } from './constants'
export {
  buildGalleryVariantUrl,
  buildProductSrcSet,
  buildProductVariantUrl,
  fileKeyFromVariant,
  normalizeCdnBase,
  resolveProductImagePreviewSrc,
  resolveProductImageSrcForVariant,
} from './build-url'
export {
  collapseDoubleSlash,
  ensureLeadingSlash,
  hasImageFileExtension,
  isHttpUrl,
  sanitizeSlugForPath,
} from './normalize'
