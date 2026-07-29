import type { GalleryLayoutMode, ProductImageFormat } from '#shared/product-images/types'
import type { ProductImageVariantKey } from '#shared/product-images/types'
import {
  DEFAULT_PRODUCT_IMAGES_CDN_BASE,
  buildGalleryVariantUrl,
  buildProductVariantUrl,
  resolveProductImagePreviewSrc as resolvePreviewSrc,
  resolveProductImageSrcForVariant as resolveSrcForVariant,
} from '#shared/product-images'

export type ProductImageSize = ProductImageVariantKey

export const PRODUCT_IMAGE_SIZE_MAIN: ProductImageSize = 'presentation_view'
export const PRODUCT_IMAGE_SIZE_THUMB: ProductImageSize = 'thumb'
export const PRODUCT_IMAGE_SIZE_SMALL: ProductImageSize = 'small'
export const PRODUCT_IMAGE_SIZE_LARGE: ProductImageSize = 'large'
export const PRODUCT_IMAGE_SIZE_BIG: ProductImageSize = 'big'

export const PRODUCT_IMAGE_SIZES: ProductImageSize[] = [
  'thumb',
  'small',
  'medium',
  'large',
  'presentation_view',
]

export function useProductImages() {
  const config = useRuntimeConfig()
  const base =
    (typeof config.public.productImagesCdnBase === 'string' && config.public.productImagesCdnBase.trim()) ||
    DEFAULT_PRODUCT_IMAGES_CDN_BASE
  const galleryLayout =
    (config.public.productImageGalleryLayout as GalleryLayoutMode | undefined) ?? 'flat'

  function getProductImageUrl(slug: string, size: ProductImageSize = 'small', format?: ProductImageFormat) {
    return buildProductVariantUrl(slug, size, { baseUrl: base, format: format ?? 'avif' })
  }

  function resolveProductImagePreviewSrc(slug: string, imagePath: string) {
    return resolvePreviewSrc(slug, imagePath, base)
  }

  function resolveProductImageSrc(slug: string, imagePath: string, size: ProductImageSize = 'medium') {
    return resolveSrcForVariant(slug, imagePath, size, base)
  }

  function getGalleryImageUrl(
    slug: string,
    galleryIndex: number,
    size: ProductImageSize = 'medium',
    format?: ProductImageFormat
  ) {
    return buildGalleryVariantUrl(slug, galleryIndex, size, {
      baseUrl: base,
      layout: galleryLayout,
      format: format ?? 'avif',
    })
  }

  return {
    cdnBase: base,
    galleryLayout,
    getProductImageUrl,
    resolveProductImagePreviewSrc,
    resolveProductImageSrc,
    getGalleryImageUrl,
    PRODUCT_IMAGE_SIZES,
    PRODUCT_IMAGE_SIZE_THUMB,
    PRODUCT_IMAGE_SIZE_SMALL,
    PRODUCT_IMAGE_SIZE_LARGE,
    PRODUCT_IMAGE_SIZE_BIG,
    PRODUCT_IMAGE_SIZE_MAIN,
  }
}
