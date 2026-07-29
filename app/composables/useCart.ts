import { storeToRefs } from 'pinia'

import { useCartStore } from '~/features/cart/stores/cart'



export function useCart() {

  const store = useCartStore()

  const { items, count, total } = storeToRefs(store)



  onMounted(() => {

    void store.fetchCart()

  })



  return {

    items,

    count,

    total,

    addItem: store.addItem,

    removeItem: store.removeItem,

    updateLineQuantity: (item: { sku: string }, quantity: number) => store.updateQuantity(item.sku, quantity),

    isAdding: store.isAdding,

    fetchCart: store.fetchCart,
    clearCart: store.clearCart,
    qtyUpdatingByKey: ref<Record<string, boolean>>({}),

  }

}


