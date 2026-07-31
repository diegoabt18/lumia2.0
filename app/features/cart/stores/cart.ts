import { defineStore } from 'pinia'

import type { CartItem } from '#shared/types/product'
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

  function addItemLocal(payload: {
    sku: string
    quantity?: number
    product: Pick<CartItem, 'productSlug' | 'productName' | 'variantLabel' | 'unitPrice' | 'currency' | 'imagePath'>
  }) {
    const qty = payload.quantity ?? 1
    const existing = items.value.find((i) => i.sku === payload.sku)

    if (existing) {
      existing.quantity += qty
      return true
    }

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

  let fetchPromise: Promise<void> | null = null

  async function fetchCart() {
    if (fetchPromise) return fetchPromise
    fetchPromise = (async () => {
      try {
        const res = await $fetch<{ items: CartItem[]; source?: string }>('/api/cart')
        if (res.source === 'local') {
          // Invitado sin cookie aún: carrito vacío en servidor, pero la API sigue disponible.
          apiEnabled.value = true
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

  /** Sincroniza líneas locales al carrito del servidor (requerido antes del checkout invitado). */
  async function syncToServer(): Promise<boolean> {
    if (!items.value.length) return false

    try {
      const current = await $fetch<{ items: CartItem[]; source?: string }>('/api/cart')
      if (current.source !== 'local' && (current.items?.length ?? 0) > 0) {
        apiEnabled.value = true
        items.value = current.items ?? []
        return true
      }

      for (const item of items.value) {
        await $fetch<{ items: CartItem[] }>('/api/cart/items', {
          method: 'POST',
          body: {
            sku: item.sku,
            quantity: item.quantity,
            product: {
              productSlug: item.productSlug,
              productName: item.productName,
              variantLabel: item.variantLabel,
              currency: item.currency,
              imagePath: item.imagePath ?? null,
            },
          },
        })
      }

      const res = await $fetch<{ items: CartItem[]; source?: string }>('/api/cart')
      apiEnabled.value = true
      if (res.items?.length) items.value = res.items
      return true
    } catch {
      return false
    }
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
            addItemLocal({ ...payload, product: payload.product })
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
      if (!payload.product) {
        useToast().error(MSG_CART_UNAVAILABLE)
        return false
      }
      const ok = addItemLocal({ ...payload, product: payload.product })
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
    syncToServer,
    clearCart,
  }
})
