export interface InventorySummary {
  quantity: number
  reserved: number
  isPerOrder: boolean
}

export function isVariantMadeToOrder(
  variant: { is_per_order?: boolean },
  inv?: InventorySummary | null
): boolean {
  return Boolean(variant.is_per_order || inv?.isPerOrder)
}

/** Misma lógica que carrito/pedidos: prioriza `inventory_items`, luego campos de variante. */
export function resolveVariantStockQuantities(
  variant: { stock?: number; available?: number; reserved?: number; is_per_order?: boolean },
  inv?: InventorySummary | null
): { stock: number | null; available: number | null } {
  if (isVariantMadeToOrder(variant, inv)) {
    return { stock: null, available: null }
  }

  if (inv) {
    const fromInventory = Math.max(0, inv.quantity - inv.reserved)
    if (inv.quantity > 0) {
      return { stock: fromInventory, available: fromInventory }
    }
  }

  const reserved = Math.max(0, Number(variant.reserved ?? 0))
  if (typeof variant.available === 'number') {
    const available = Math.max(0, variant.available - reserved)
    return { stock: available, available }
  }
  if (typeof variant.stock === 'number') {
    const available = Math.max(0, variant.stock - reserved)
    return { stock: variant.stock, available }
  }

  return { stock: 0, available: 0 }
}
