import type { ApiShippingSettings, StoreBanner } from '#shared/types/store-settings'
import { buildShippingConfig, mapApiShippingSettings, type ShippingConfig } from '#shared/pricing/shipping-cost'

/** Valor por defecto del tooltip de promoción (ms), igual que en el servidor. */
export const DEFAULT_PROMOTION_TOOLTIP_DELAY_MS = 1000

export function useStoreSettings() {
  const shippingFromApi = useState<ApiShippingSettings | null>('store-shipping-api', () => null)
  const banners = useState<StoreBanner[]>('store-banners', () => [])
  const loaded = useState('store-settings-loaded', () => false)
  const promotionTooltipDelayMs = useState<number>('store-promo-tooltip-delay', () => DEFAULT_PROMOTION_TOOLTIP_DELAY_MS)

  async function loadCustomerSettings() {
    try {
      const res = await $fetch<{ settings?: { promotionTooltipDelayMs?: unknown } }>('/api/store/customer-settings', {
        timeout: 8_000,
      })
      const raw = res.settings?.promotionTooltipDelayMs
      promotionTooltipDelayMs.value =
        typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw <= 5000
          ? raw
          : DEFAULT_PROMOTION_TOOLTIP_DELAY_MS
    } catch {
      promotionTooltipDelayMs.value = DEFAULT_PROMOTION_TOOLTIP_DELAY_MS
    }
  }

  async function loadShippingSettings() {
    try {
      const res = await $fetch<{ data: ApiShippingSettings }>('/api/store/shipping-settings', { timeout: 8_000 })
      shippingFromApi.value = res.data ?? null
    } catch {
      shippingFromApi.value = null
    }
  }

  async function loadBanners(positions?: string) {
    try {
      const res = await $fetch<{ banners: StoreBanner[] }>('/api/store/banners', {
        query: positions ? { positions } : undefined,
        timeout: 8_000,
      })
      banners.value = res.banners ?? []
    } catch {
      banners.value = []
    }
  }

  async function ensureLoaded() {
    if (loaded.value) return
    await Promise.all([
      loadShippingSettings(),
      loadBanners('homepage_secondary,catalog_top'),
      loadCustomerSettings(),
    ])
    loaded.value = true
  }

  const shippingConfig = computed((): ShippingConfig => {
    if (shippingFromApi.value) return mapApiShippingSettings(shippingFromApi.value)
    const config = useRuntimeConfig()
    return buildShippingConfig({
      freeShippingThreshold: config.public.storeFreeShippingThreshold,
      flatRate: config.public.storeShippingFlatRate,
    })
  })

  function bannersFor(position: string) {
    return computed(() =>
      banners.value
        .filter((b) => b.position === position)
        .sort((a, b) => a.priority - b.priority)
    )
  }

  return {
    shippingFromApi: readonly(shippingFromApi),
    banners: readonly(banners),
    shippingConfig,
    promotionTooltipDelayMs: readonly(promotionTooltipDelayMs),
    ensureLoaded,
    loadBanners,
    bannersFor,
  }
}
