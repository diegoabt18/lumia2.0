export function usePosApi() {
  async function getPaymentMethods() {
    return $fetch<{ methods: PosPaymentMethod[] }>('/api/admin/pos/payment-methods')
  }

  async function searchProducts(search: string, limit = 12) {
    return $fetch<{ products: PosProduct[] }>('/api/admin/pos/products', {
      query: { search, limit },
    })
  }

  async function searchCustomers(search: string, limit = 10) {
    return $fetch<{ customers: PosCustomer[] }>('/api/admin/pos/customers', {
      query: { search, limit },
    })
  }

  async function createSale(payload: Record<string, unknown>, idempotencyKey: string) {
    return $fetch<PosSaleResult>('/api/admin/pos/sales', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: payload,
    })
  }

  async function confirmPayment(id: string, payload: Record<string, unknown>) {
    return $fetch<PosSaleView>(`/api/admin/pos/sales/${encodeURIComponent(id)}/payment/confirm`, {
      method: 'POST',
      body: payload,
    })
  }

  return {
    getPaymentMethods,
    searchProducts,
    searchCustomers,
    createSale,
    confirmPayment,
  }
}