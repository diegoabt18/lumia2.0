export interface StoreBanner {
  id: string
  position: string
  priority: number
  imageUrl: string
  title: string | null
  subtitle: string | null
  ctaLabel: string | null
  href: string
}

export interface ApiShippingSettings {
  shippingEnabled: boolean
  freeShippingEnabled: boolean
  freeShippingThreshold: number
  calculationType: string
  flatRateEnabled: boolean
  flatRate: number
  applyThresholdOn: string
  showProgressBar?: boolean
  showMessages?: boolean
}

export interface StoreNotification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface ShippingAddress {
  id?: string
  label?: string
  recipientName: string
  phone: string
  address: string
  city: string
  reference: string
  isPrimary: boolean
}

export interface NotificationPreferences {
  promotions: boolean
  orderStatus: boolean
  newProducts: boolean
}
