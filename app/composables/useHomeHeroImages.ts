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

export async function discoverHomeHeroSlides(imageCdnUrl: string, maxSlides = 8): Promise<string[]> {
  return fetchCdnUrls('home', { max: maxSlides, base: imageCdnUrl })
}

export async function discoverMomentsGalleryImages(
  imageCdnUrl: string,
  maxImages = 12
): Promise<string[]> {
  return fetchCdnUrls('moments', { max: maxImages, base: imageCdnUrl })
}

export async function discoverBrandHistoryImage(imageCdnUrl: string): Promise<string | null> {
  const urls = await fetchCdnUrls('history', { file: 'image.avif', base: imageCdnUrl })
  return urls[0] ?? null
}

export { resolveCdnFolderBase, buildNumberedImageUrl }
