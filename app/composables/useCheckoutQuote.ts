/**
 * Cotización financiera autoritativa del carrito (anticipo y saldo por línea).
 * El cálculo lo realiza Server (`POST /api/orders/quote`); aquí solo se muestra el resultado.
 * Antes de cotizar se sincroniza el carrito con el servidor, que es el que conoce modalidad y política.
 */
export interface CheckoutQuoteItem {
  sku: string
  name: string
  variantLabel: string | null
  quantity: number
  unitPrice: number
  subtotal: number
  fulfillmentMode: 'stock' | 'made_to_order'
  initialPaymentRequired: number
  balanceDue: number
}

export interface CheckoutQuote {
  currency: string
  total: number
  initialPaymentRequired: number
  balanceDue: number
  items: CheckoutQuoteItem[]
}

export function useCheckoutQuote() {
  const { items, syncToServer } = useCart()

  const quote = ref<CheckoutQuote | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let requestSeq = 0
  let debounce: ReturnType<typeof setTimeout> | null = null

  const cartKey = computed(() => items.value.map((i) => `${i.sku}:${i.quantity}`).join('|'))

  async function refresh() {
    if (!items.value.length) {
      quote.value = null
      error.value = null
      return
    }
    const seq = ++requestSeq
    loading.value = true
    try {
      await syncToServer()
      const result = await $fetch<CheckoutQuote>('/api/orders/quote', { method: 'POST' })
      if (seq === requestSeq) {
        quote.value = result
        error.value = null
      }
    } catch (e: unknown) {
      if (seq === requestSeq) {
        const err = e as { data?: { message?: string }; message?: string }
        error.value = err?.data?.message ?? err?.message ?? 'No se pudo calcular el anticipo.'
      }
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  function scheduleRefresh() {
    if (debounce) clearTimeout(debounce)
    debounce = setTimeout(() => {
      void refresh()
    }, 250)
  }

  onMounted(() => {
    void refresh()
  })
  watch(cartKey, scheduleRefresh)
  onBeforeUnmount(() => {
    if (debounce) clearTimeout(debounce)
  })

  return { quote, loading, error, refresh }
}
