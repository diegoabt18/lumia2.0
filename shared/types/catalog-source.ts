/** Fuente de lectura del catálogo público. */
export type CatalogSourceMode = 'mongo' | 'd1' | 'auto'

/** Fuente resuelta en runtime (sin `auto`). */
export type ResolvedCatalogSource = 'mongo' | 'd1'
