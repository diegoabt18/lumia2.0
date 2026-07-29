import { buildShippingConfig, quoteShipping, remainingForFreeShipping } from '#shared/pricing/shipping-cost'

export function useStoreShipping() {
  const config = useRuntimeConfig()

  const shippingConfig = computed(() =>
    buildShippingConfig({
      freeShippingThreshold: config.public.storeFreeShippingThreshold,
      flatRate: config.public.storeShippingFlatRate,
    })
  )

  function quote(subtotal: number) {
    return quoteShipping(subtotal, shippingConfig.value)
  }

  function freeShippingRemaining(subtotal: number) {
    return remainingForFreeShipping(shippingConfig.value, { subtotal })
  }

  return {
    shippingConfig,
    quote,
    freeShippingRemaining,
  }
}
