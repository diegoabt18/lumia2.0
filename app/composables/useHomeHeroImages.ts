import {
  discoverFixedImage,
  discoverNumberedImages,
  resolveCdnFolderBase,
  buildNumberedImageUrl,
} from '#shared/cdn-images/numbered-images'

export async function discoverHomeHeroSlides(productCdnBase: string, maxSlides = 8): Promise<string[]> {
  return discoverNumberedImages(productCdnBase, 'home', maxSlides)
}

export async function discoverMomentsGalleryImages(
  productCdnBase: string,
  maxImages = 12
): Promise<string[]> {
  return discoverNumberedImages(productCdnBase, 'moments', maxImages)
}

export async function discoverBrandHistoryImage(productCdnBase: string): Promise<string | null> {
  return discoverFixedImage(productCdnBase, 'history', 'image.avif')
}

export { resolveCdnFolderBase, buildNumberedImageUrl }
