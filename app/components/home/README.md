# Home — Bloques de la landing

Secciones de la página principal (`/`). Cada bloque es un componente independiente.

## Componentes

| Archivo | Sección |
|---------|---------|
| `HomeHero.vue` | Hero full-bleed con imagen Unsplash y CTAs |
| `HomeFeaturedProducts.vue` | Grid de `ProductCardPremium` (destacados) |
| `HomeCategoryGrid.vue` | 4 colecciones hardcodeadas → `/products` |
| `HomeBrandStory.vue` | Historia de marca + imagen |
| `HomeBenefits.vue` | 4 beneficios con iconos Tabler |
| `HomeTestimonials.vue` | 3 testimonios estáticos |
| `HomeInstaGallery.vue` | Grid 6 imágenes estilo Instagram |
| `HomeNewsletterSection.vue` | Formulario newsletter (UI only, sin backend) |

## Datos

- Productos destacados: API `/api/products` con fallback a `shared/mocks/products.ts`
- Banners dinámicos (`HomeDynamicHero`): Fase 3

## Orden en `pages/index.vue`

Hero → Featured → Categories → Story → Benefits → Testimonials → Insta → Newsletter
