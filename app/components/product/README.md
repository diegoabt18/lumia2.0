# Product — Catálogo y PDP

Componentes de presentación de productos.

## Componentes

| Archivo | Propósito |
|---------|-----------|
| `ProductCardPremium.vue` | Tarjeta de catálogo con badges, rating, quick-add, hover CTA desktop |
| `ProductShopImage.vue` | Imagen con fallback placeholder LUMIA. Remotas vía `<img>`, locales vía `NuxtImg` |

## Imágenes

Rutas resueltas por `composables/useProductImages.ts`:

```
{CDN_BASE}/{slug}/{slug}-large.avif
```

Default dev: Unsplash. Producción: jsDelivr + repo `lumia_images`.

## PDP

Componentes de ficha de producto (`features/product/components/pdp/`): **Fase 2/3**.
