import { resolveCdnFolderBase, buildNumberedImageUrl } from '#shared/cdn-images/numbered-images'

async function fetchCdnUrls(
  folder: string,
  opts: { max?: number; file?: string; base?: string } = {}
): Promise<string[]> {
  const res = await $fetch<{ urls: string[] }>('/api/cdn/images', {
    query: {
      folder,
      max: opts.max,
      file: opts.file,
      base: opts.base?.trim() || undefined,
    },
  }).catch(() => ({ urls: [] as string[] }))
  return res.urls ?? []
}

export async function discoverHomeHeroSlides(productCdnBase: string, maxSlides = 8): Promise<string[]> {
  return fetchCdnUrls('home', { max: maxSlides, base: productCdnBase })
}

export async function discoverMomentsGalleryImages(
  productCdnBase: string,
  maxImages = 12
): Promise<string[]> {
  return fetchCdnUrls('moments', { max: maxImages, base: productCdnBase })
}

export async function discoverBrandHistoryImage(productCdnBase: string): Promise<string | null> {
  const urls = await fetchCdnUrls('history', { file: 'image.avif', base: productCdnBase })
  return urls[0] ?? null
}

export { resolveCdnFolderBase, buildNumberedImageUrl }
