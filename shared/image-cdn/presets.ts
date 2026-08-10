export type ImageOutputFormat = 'avif' | 'webp'

export type ImageSizePreset = {
  key: string
  width: number
  height: number
  usage: string
}

/** Solo referencia de tamaños en CDN — LUMIA 2.0 NO procesa imágenes. */
export const PRODUCT_SIZE_PRESETS: readonly ImageSizePreset[] = [
  { key: 'thumb', width: 100, height: 100, usage: 'Grid pequeño / carrito' },
  { key: 'small', width: 300, height: 300, usage: 'Cards móvil' },
  { key: 'medium', width: 600, height: 600, usage: 'Detalle producto' },
  { key: 'large', width: 1024, height: 1024, usage: 'Zoom desktop' },
  { key: 'big', width: 1300, height: 1300, usage: 'Alta resolución / LCP' },
] as const

export const DISTRIBUTION_FORMATS: readonly ImageOutputFormat[] = ['avif', 'webp']

export const IMAGE_VERSIONING_STRATEGY = 'overwrite-deterministic' as const
