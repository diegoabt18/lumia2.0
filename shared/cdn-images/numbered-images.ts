import { DEFAULT_IMAGE_CDN_URL, normalizeCdnUrl } from '../image-cdn'

/** Carpeta bajo la raíz del CDN (`home`, `moments`, `main_logo`, …). */
export function resolveCdnFolderBase(imageCdnUrl: string, folder: string): string {
  const root = normalizeCdnUrl(imageCdnUrl.trim() || DEFAULT_IMAGE_CDN_URL)
  const name = folder.trim().replace(/^\/+|\/+$/g, '')
  return name ? `${root}/${name}` : root
}

export function buildNumberedImageUrl(folderBase: string, index: number): string {
  return `${folderBase.replace(/\/$/, '')}/image_${index}.avif`
}

export function buildFolderImageUrl(imageCdnUrl: string, folder: string, filename: string): string {
  const folderBase = resolveCdnFolderBase(imageCdnUrl, folder)
  return `${folderBase}/${filename.replace(/^\/+/, '')}`
}

export async function discoverFixedImage(
  imageCdnUrl: string,
  folder: string,
  filename: string
): Promise<string | null> {
  const url = buildFolderImageUrl(imageCdnUrl, folder, filename)
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(1500) })
    return res.ok ? url : null
  } catch {
    return null
  }
}

/** Detecta image_1.avif, image_2.avif… hasta el primer hueco o maxCount. */
export async function discoverNumberedImages(
  imageCdnUrl: string,
  folder: string,
  maxCount: number
): Promise<string[]> {
  const folderBase = resolveCdnFolderBase(imageCdnUrl, folder)
  const images: string[] = []

  for (let i = 1; i <= maxCount; i++) {
    const url = buildNumberedImageUrl(folderBase, i)
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(1500) })
      if (!res.ok) break
      images.push(url)
    } catch {
      break
    }
  }

  return images
}
