/** Variantes de archivo en CDN/repo (alineado con estudio AVIF + PDP legacy). */
export type ProductImageVariantKey =
  | 'thumb'
  | 'small'
  | 'medium'
  | 'large'
  | 'big'
  /** Alias PDP → archivo `big` en repo. */
  | 'presentation_view'

/** Producto principal vs galería secundaria. */
export type ProductImageRole = 'main' | 'gallery'

/** Convención de carpetas para galería en storage/CDN. */
export type GalleryLayoutMode = 'flat' | 'nested'

/** Formato de salida estándar en Lumia. */
export type ProductImageFormat = 'avif' | 'webp'

export interface ProductImageVariantSpec {
  variant: ProductImageVariantKey
  format?: ProductImageFormat
}

/** Set mínimo para `<picture>` / srcset (extensible). */
export interface ResponsiveImageCandidate {
  url: string
  width: number
  descriptor?: string
}

export interface ResponsiveImageSet {
  defaultSrc: string
  candidates: ResponsiveImageCandidate[]
}
