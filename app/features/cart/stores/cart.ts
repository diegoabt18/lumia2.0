import { defineStore } from 'pinia'

import type { CartItem } from '#shared/types/product'
import { formatVariantLabel } from '#shared/variant-label'
import { MOCK_PRODUCTS } from '#shared/mocks/products'
import { useToast } from '~/composables/useToast'

function httpStatusFromError(e: unknown): number | undefined {
  if (!e || typeof e !== 'object') return undefined
  const o = e as Record<string, unknown>
  const s = o.statusCode ?? o.status
  return typeof s === 'number' ? s : undefined
}

const MSG_CART_UNAVAILABLE = 'No pudimos actualizar el carrito. Inténtalo de nuevo.'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const apiEnabled = ref<boolean | null>(null)
  const addingByKey = ref<Record<string, boolean>>({})
  const qtyUpdatingByKey = ref<Record<string, boolean>>({})

  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const total = computed(() => items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))

  function buildAddKey(payload: { sku: string }) {
    return payload.sku
  }

  function isAdding(payload: { sku: string }) {
    return Boolean(addingByKey.value[buildAddKey(payload)])
  }

  function isQtyUpdating(sku: string) {
    return Boolean(qtyUpdatingByKey.value[sku])
  }

  function findProductBySku(sku: string) {
    for (const product of MOCK_PRODUCTS) {
      const variant = product.variants?.find((v) => v.sku === sku)
      if (variant) return { product, variant }
    }
    return null
  }

  function addItemLocal(payload: {
    sku: string
    quantity?: number
    product?: Pick<CartItem, 'productSlug' | 'productName' | 'variantLabel' | 'unitPrice' | 'currency' | 'imagePath'>
  }) {
    const qty = payload.quantity ?? 1
    const existing = items.value.find((i) => i.sku === payload.sku)

    if (existing) {
      existing.quantity += qty
      return true
    }

    if (payload.product) {
      items.value.push({
        sku: payload.sku,
        productSlug: payload.product.productSlug,
        productName: payload.product.productName,
        variantLabel: payload.product.variantLabel,
        quantity: qty,
        unitPrice: payload.product.unitPrice,
        currency: payload.product.currency,
        imagePath: payload.product.imagePath,
      })
      return true
    }

    const match = findProductBySku(payload.sku)
    if (!match) return false

    const { product, variant } = match
    items.value.push({
      sku: variant.sku,
      productSlug: product.slug,
      productName: product.name,
      variantLabel: formatVariantLabel(variant.options, variant.sku),
      quantity: qty,
      unitPrice: variant.salePrice ?? variant.price,
      currency: variant.currency ?? 'COP',
      imagePath: product.imagePath,
    })
    return true
  }

  let fetchPromise: Promise<void> | null = null

  async function fetchCart() {
    if (fetchPromise) return fetchPromise
    fetchPromise = (async () => {
      try {
        const res = await $fetch<{ items: CartItem[]; source?: string }>('/api/cart')
        if (res.source === 'local') {
          apiEnabled.value = false
          return
        }
        apiEnabled.value = true
        items.value = res.items ?? []
      } catch {
        apiEnabled.value = false
      } finally {
        fetchPromise = null
      }
    })()
    return fetchPromise
  }

  async function addItem(payload: {
    sku: string
    quantity?: number
    product?: Pick<CartItem, 'productSlug' | 'productName' | 'variantLabel' | 'unitPrice' | 'currency' | 'imagePath'>
  }) {
    const key = buildAddKey(payload)
    if (addingByKey.value[key]) return false
    addingByKey.value[key] = true

    const prevItems = items.value.map((i) => ({ ...i }))
    let optimistic = false

    try {
      if (apiEnabled.value !== false) {
        try {
          if (payload.product) {
            addItemLocal(payload)
            optimistic = true
          }

          const res = await $fetch<{ items: CartItem[]; total?: number; ok?: boolean }>('/api/cart/items', {
            method: 'POST',
            body: {
              sku: payload.sku,
              quantity: payload.quantity ?? 1,
              product: payload.product
                ? {
                    productSlug: payload.product.productSlug,
                    productName: payload.product.productName,
                    variantLabel: payload.product.variantLabel,
                    currency: payload.product.currency,
                    imagePath: payload.product.imagePath ?? null,
                  }
                : undefined,
            },
          })

          apiEnabled.value = true
          if (res.items?.length) items.value = res.items

          if (payload.product?.productName) {
            useToast().success(`"${payload.product.productName}" agregado al carrito`)
          }
          return true
        } catch (e) {
          if (optimistic) items.value = prevItems
          const status = httpStatusFromError(e)
          if (status === 401) {
            useToast().error(MSG_CART_UNAVAILABLE)
            return false
          }
          if (status === 503) apiEnabled.value = false
          else if (status === 500 || status === 409 || status === 422) {
            useToast().error(MSG_CART_UNAVAILABLE)
            return false
          } else throw e
        }
      }
      const ok = addItemLocal(payload)
      if (ok && payload.product?.productName) {
        useToast().success(`"${payload.product.productName}" agregado al carrito`)
      }
      return ok
    } finally {
      addingByKey.value[key] = false
    }
  }

  async function removeItem(sku: string) {
    if (apiEnabled.value) {
      try {
        const res = await $fetch<{ items: CartItem[] }>('/api/cart/items', { method: 'DELETE', body: { sku } })
        if (res.items) items.value = res.items
        else await fetchCart()
      } catch (e) {
        if (httpStatusFromError(e) === 401) {
          useToast().error(MSG_CART_UNAVAILABLE)
          return
        }
        throw e
      }
      return
    }
    items.value = items.value.filter((i) => i.sku !== sku)
  }

  async function updateQuantity(sku: string, quantity: number) {
    if (qtyUpdatingByKey.value[sku]) return
    qtyUpdatingByKey.value = { ...qtyUpdatingByKey.value, [sku]: true }
    try {
      if (apiEnabled.value) {
        try {
          const res = await $fetch<{ items: CartItem[] }>('/api/cart/items', {
            method: 'PATCH',
            body: { sku, quantity },
          })
          if (res.items) items.value = res.items
          else await fetchCart()
        } catch (e) {
          if (httpStatusFromError(e) === 401) {
            useToast().error(MSG_CART_UNAVAILABLE)
            return
          }
          throw e
        }
        return
      }
      const item = items.value.find((i) => i.sku === sku)
      if (!item) return
      if (quantity < 1) {
        items.value = items.value.filter((i) => i.sku !== sku)
        return
      }
      item.quantity = quantity
    } finally {
      const { [sku]: _, ...rest } = qtyUpdatingByKey.value
      qtyUpdatingByKey.value = rest
    }
  }

  async function clearCart() {
    if (apiEnabled.value) {
      try {
        await $fetch('/api/cart', { method: 'DELETE' })
      } catch {
        /* noop */
      }
    }
    items.value = []
  }

  return {
    items,
    count,
    total,
    apiEnabled,
    isAdding,
    isQtyUpdating,
    qtyUpdatingByKey,
    addItem,
    removeItem,
    updateQuantity,
    fetchCart,
    clearCart,
  }
})
