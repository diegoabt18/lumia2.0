# Catalog — Dominio de catálogo

Lectura de productos desde MongoDB. Compatible con el esquema del proyecto `lumia`.

## Colecciones

| Colección | Contenido |
|-----------|-----------|
| `products` | Productos (slug, name, image_path, …) |
| `variants` | Variantes por `product_slug` |
| `inventory_items` | Stock por SKU |
| `product_options` | Opciones legacy embebidas |

## Archivos

| Archivo | Propósito |
|---------|-----------|
| `infrastructure/product.repository.ts` | Queries de lectura + mappers |
| `README.md` | Esta documentación |

## Mapper

Convierte documentos Mongo → `shared/types/product.ts` para que el frontend no cambie.
