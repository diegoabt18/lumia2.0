import { storeToRefs } from 'pinia'

import { useCartStore } from '~/features/cart/stores/cart'

export function useCart() {
  const store = useCartStore()
  const { items, count, total, qtyUpdatingByKey } = storeToRefs(store)

  return {
    items,
    count,
    total,
    qtyUpdatingByKey,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateLineQuantity: (item: { sku: string }, quantity: number) => store.updateQuantity(item.sku, quantity),
    isAdding: store.isAdding,
    isQtyUpdating: store.isQtyUpdating,
    fetchCart: store.fetchCart,
    syncToServer: store.syncToServer,
    clearCart: store.clearCart,
  }
}
