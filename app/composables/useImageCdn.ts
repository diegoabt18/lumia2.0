import {
  buildCdnAssetUrl,
  resolveImageCdnUrl,
  resolveProductImagesCdnBase,
  swapImageFormat,
} from '#shared/image-cdn'

/** Configuración centralizada del CDN — solo consumo, sin procesamiento. */
export function useImageCdn() {
  const config = useRuntimeConfig()
  const publicCfg = config.public as Record<string, unknown>

  const imageCdnUrl = resolveImageCdnUrl(
    typeof publicCfg.imageCdnUrl === 'string' ? publicCfg.imageCdnUrl : ''
  )

  const productImagesCdnBase = resolveProductImagesCdnBase({ imageCdnUrl })

  function assetUrl(imageKey: string, filename: string): string {
    return buildCdnAssetUrl(imageKey, filename, { cdnUrl: imageCdnUrl })
  }

  return {
    imageCdnUrl,
    productImagesCdnBase,
    assetUrl,
    swapImageFormat,
  }
}
