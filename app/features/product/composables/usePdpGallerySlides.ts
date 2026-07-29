import type { PdpGallerySlide } from '../types/pdp'

function probeImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false)
      return
    }
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

const MAX_GALLERY_INDEX = 8

export function usePdpGallerySlides(
  slug: ComputedRef<string>,
  catalogImagePath: ComputedRef<string>
) {
  const { resolveProductImageSrc, getGalleryImageUrl, PRODUCT_IMAGE_SIZE_MAIN } = useProductImages()

  function mainSlide(): PdpGallerySlide {
    const s = slug.value
    const path = catalogImagePath.value
    const hero = resolveProductImageSrc(s, path, PRODUCT_IMAGE_SIZE_MAIN)
    const large = resolveProductImageSrc(s, path, 'large')
    const medium = resolveProductImageSrc(s, path, 'medium')
    const thumb = resolveProductImageSrc(s, path, 'thumb')
    return {
      id: 'main',
      src: large || hero,
      thumb: thumb || medium || large || hero,
      alt: 'Vista principal',
    }
  }

  const slides = ref<PdpGallerySlide[]>([mainSlide()])
  const probing = ref(false)

  async function refreshSlidesClient() {
    if (!import.meta.client) return
    probing.value = true
    try {
      const baseList: PdpGallerySlide[] = [mainSlide()]
      const checks: Promise<{ index: number; ok: boolean }>[] = []
      for (let i = 1; i <= MAX_GALLERY_INDEX; i++) {
        const url = getGalleryImageUrl(slug.value, i, 'large')
        checks.push(probeImageUrl(url).then((ok) => ({ index: i, ok })))
      }
      const results = await Promise.all(checks)
      for (const { index, ok } of results.sort((a, b) => a.index - b.index)) {
        if (!ok) continue
        const src = getGalleryImageUrl(slug.value, index, 'large')
        const thumb = getGalleryImageUrl(slug.value, index, 'medium')
        baseList.push({
          id: `gallery-${index}`,
          src,
          thumb,
          alt: `Imagen ${index}`,
        })
      }
      slides.value = baseList
    } finally {
      probing.value = false
    }
  }

  watch(
    [slug, catalogImagePath],
    () => {
      slides.value = [mainSlide()]
      void refreshSlidesClient()
    },
    { immediate: true }
  )

  onMounted(() => {
    void refreshSlidesClient()
  })

  return { slides, probing }
}
