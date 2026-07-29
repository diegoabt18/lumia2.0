export type CalculationType = 'flat_rate' | string

export type ThresholdApplication = 'subtotal' | 'total_before_taxes' | 'total_final'

export interface ShippingConfig {
  shippingEnabled: boolean
  freeShippingEnabled: boolean
  freeShippingThreshold: number
  calculationType: CalculationType
  flatRateEnabled: boolean
  flatRate: number
  applyThresholdOn: ThresholdApplication
}

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  shippingEnabled: false,
  freeShippingEnabled: false,
  freeShippingThreshold: 0,
  calculationType: 'flat_rate',
  flatRateEnabled: false,
  flatRate: 0,
  applyThresholdOn: 'subtotal',
}

/** Construye config de envío desde runtimeConfig público. */
export function buildShippingConfig(input: {
  freeShippingThreshold?: number
  flatRate?: number
}): ShippingConfig {
  const flatRate = Math.max(0, Number(input.flatRate) || 0)
  const freeShippingThreshold = Math.max(0, Number(input.freeShippingThreshold) || 0)
  const shippingEnabled = flatRate > 0 || freeShippingThreshold > 0

  return {
    shippingEnabled,
    freeShippingEnabled: freeShippingThreshold > 0,
    freeShippingThreshold,
    calculationType: 'flat_rate',
    flatRateEnabled: flatRate > 0,
    flatRate,
    applyThresholdOn: 'subtotal',
  }
}

export interface ShippingQuote {
  subtotal: number
  shippingCost: number
  grandTotal: number
  freeShipping: boolean
  /** true cuando no hay tarifa fija y el costo se coordina con el vendedor */
  variable: boolean
}

export function quoteShipping(subtotal: number, config: ShippingConfig): ShippingQuote {
  const safeSubtotal = Math.max(0, subtotal)
  const variable = isShippingVariable(config)
  const shippingCost = calculateShippingCost(config, { subtotal: safeSubtotal })
  const freeShipping = isFreeShippingEligible(config, { subtotal: safeSubtotal })

  return {
    subtotal: safeSubtotal,
    shippingCost,
    grandTotal: safeSubtotal + shippingCost,
    freeShipping,
    variable,
  }
}

export interface ShippingCalculationInput {
  subtotal: number
  totalBeforeTaxes?: number
  totalFinal?: number
}

export function calculateShippingCost(config: ShippingConfig, input: ShippingCalculationInput): number {
  if (!config.shippingEnabled) return 0

  const thresholdBase = getThresholdBase(config.applyThresholdOn, input)
  if (config.freeShippingEnabled && thresholdBase >= config.freeShippingThreshold) {
    return 0
  }

  if (config.calculationType === 'flat_rate') {
    if (!config.flatRateEnabled) return 0
    return config.flatRate
  }

  return 0
}

function getThresholdBase(
  applyThresholdOn: ShippingConfig['applyThresholdOn'],
  input: ShippingCalculationInput
): number {
  switch (applyThresholdOn) {
    case 'total_before_taxes':
      return input.totalBeforeTaxes ?? input.subtotal
    case 'total_final':
      return input.totalFinal ?? input.subtotal
    default:
      return input.subtotal
  }
}

export function isShippingVariable(config: ShippingConfig): boolean {
  if (!config.shippingEnabled) return false
  return config.calculationType === 'flat_rate' && !config.flatRateEnabled
}

export function isFreeShippingEligible(config: ShippingConfig, input: ShippingCalculationInput): boolean {
  if (!config.shippingEnabled || !config.freeShippingEnabled) return false
  const thresholdBase = getThresholdBase(config.applyThresholdOn, input)
  return thresholdBase >= config.freeShippingThreshold
}

export function remainingForFreeShipping(config: ShippingConfig, input: ShippingCalculationInput): number {
  if (!config.shippingEnabled || !config.freeShippingEnabled) return 0
  const thresholdBase = getThresholdBase(config.applyThresholdOn, input)
  if (thresholdBase >= config.freeShippingThreshold) return 0
  return Math.max(0, config.freeShippingThreshold - thresholdBase)
}
