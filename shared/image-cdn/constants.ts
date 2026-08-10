/**
 * Raíz del CDN de imágenes optimizadas (repo Git → Cloudflare).
 * Sin barra final. No hardcodear dominios fuera de este módulo.
 */
export const DEFAULT_IMAGE_CDN_URL =
  'https://raw.githubusercontent.com/lumiadali/lumia_images/refs/heads/main'

export const IMAGE_CDN_NAMESPACES = {
  products: 'products',
  materials: 'materials',
  categories: 'categories',
  banners: 'banners',
  avatars: 'avatars',
  promotions: 'promotions',
  home: 'home',
  moments: 'moments',
  history: 'history',
  logo: 'main_logo',
  other: 'other',
} as const

export type ImageCdnNamespace = (typeof IMAGE_CDN_NAMESPACES)[keyof typeof IMAGE_CDN_NAMESPACES]
