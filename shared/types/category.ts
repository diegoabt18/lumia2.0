/** Categoría pública (solo activas). Fuente: Server GET /api/categories. */
export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  imagePath?: string | null
  productCount?: number
  subcategoryCount?: number
}

/** Respuesta de GET /api/categories/:id: categoría activa con sus subcategorías activas. */
export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[]
}

/** Subcategoría pública (solo activas). Fuente: Server GET /api/categories/:id/subcategories. */
export interface Subcategory {
  id: string
  categoryId: string
  name: string
  slug: string
  description?: string | null
  imagePath?: string | null
  productCount?: number
}
