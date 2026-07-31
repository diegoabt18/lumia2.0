import { quoteShipping, remainingForFreeShipping } from '#shared/pricing/shipping-cost'

export function useStoreShipping() {
  const { shippingConfig } = useStoreSettings()

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
