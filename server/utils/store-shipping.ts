import { buildShippingConfig, quoteShipping, type ShippingQuote } from '#shared/pricing/shipping-cost'

export function getStoreShippingConfig() {
  const config = useRuntimeConfig()
  return buildShippingConfig({
    freeShippingThreshold: config.public.storeFreeShippingThreshold,
    flatRate: config.public.storeShippingFlatRate,
  })
}

export function quoteStoreShipping(subtotal: number): ShippingQuote {
  return quoteShipping(subtotal, getStoreShippingConfig())
}
