import { DEFAULT_PRODUCT_IMAGES_CDN_BASE } from '../product-images/constants'

export function resolveCdnFolderBase(productCdnBase: string, folder: string): string {
  const trimmed = (productCdnBase.trim() || DEFAULT_PRODUCT_IMAGES_CDN_BASE).replace(/\/$/, '')
  if (trimmed.endsWith('/products')) {
    return `${trimmed.slice(0, -'/products'.length)}/${folder}`
  }
  return `${trimmed}/${folder}`
}

export function buildNumberedImageUrl(folderBase: string, index: number): string {
  return `${folderBase.replace(/\/$/, '')}/image_${index}.avif`
}

export function buildFolderImageUrl(productCdnBase: string, folder: string, filename: string): string {
  const folderBase = resolveCdnFolderBase(productCdnBase, folder)
  return `${folderBase.replace(/\/$/, '')}/${filename}`
}

export async function discoverFixedImage(
  productCdnBase: string,
  folder: string,
  filename: string
): Promise<string | null> {
  const url = buildFolderImageUrl(productCdnBase, folder, filename)
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(2500) })
    return res.ok ? url : null
  } catch {
    return null
  }
}

/** Detecta image_1.avif, image_2.avif… hasta el primer hueco o maxCount. */
export async function discoverNumberedImages(
  productCdnBase: string,
  folder: string,
  maxCount: number
): Promise<string[]> {
  const folderBase = resolveCdnFolderBase(productCdnBase, folder)
  const images: string[] = []

  for (let i = 1; i <= maxCount; i++) {
    const url = buildNumberedImageUrl(folderBase, i)
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(2500) })
      if (!res.ok) break
      images.push(url)
    } catch {
      break
    }
  }

  return images
}
