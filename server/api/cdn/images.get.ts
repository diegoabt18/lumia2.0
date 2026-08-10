import {
  discoverFixedImage,
  discoverNumberedImages,
} from '#shared/cdn-images/numbered-images'
import { resolveImageCdnUrl } from '#shared/image-cdn'
import { setPublicCacheHeaders } from '../../utils/memory-cache'
import { withServerTimeout } from '../../utils/server-timeout'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const config = useRuntimeConfig()
  const publicCfg = config.public as Record<string, unknown>
  const cdnRoot =
    (typeof query.base === 'string' && query.base.trim()) ||
    resolveImageCdnUrl(typeof publicCfg.imageCdnUrl === 'string' ? publicCfg.imageCdnUrl : '')

  const folder = typeof query.folder === 'string' ? query.folder.trim() : ''
  if (!folder || !/^[a-z0-9_-]+$/i.test(folder)) {
    throw createError({ statusCode: 400, message: 'Carpeta CDN inválida' })
  }

  const max = Math.min(24, Math.max(1, Number(query.max) || 12))
  const file = typeof query.file === 'string' ? query.file.trim() : ''

  setPublicCacheHeaders(event, 300)

  if (file) {
    const url = await withServerTimeout(discoverFixedImage(cdnRoot, folder, file), 4_000, 'cdn image')
    return { urls: url ? [url] : [] }
  }

  const urls = await withServerTimeout(discoverNumberedImages(cdnRoot, folder, max), 6_000, 'cdn images')
  return { urls }
})
