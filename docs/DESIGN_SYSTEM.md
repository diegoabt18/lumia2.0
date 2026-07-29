# Sistema de diseño — Lumia 2.0

Referencia visual en vivo: **`/design-system`**

Fuente de tokens en código: `shared/design-system/tokens.ts`  
Configuración Tailwind: `tailwind.config.ts`  
Estilos base: `app/assets/css/main.css`

## Paleta `lumia`

| Token | Hex | Uso |
|-------|-----|-----|
| `lumia-black` | `#0F0F0F` | Botones primary, footer |
| `lumia-ink` | `#2B2B2B` | Texto principal |
| `lumia-gold` | `#C9A24A` | Acentos, badges, links hover |
| `lumia-beige` | `#E8DCC8` | Fondos secundarios |
| `lumia-cream` | `#F6F1E7` | Cards, superficies |
| `lumia-canvas` | `#FAF8F5` | Fondo general |
| `lumia-success` | `#D6E5DA` | Estados positivos |

## Tipografía

| Clase | Familia | Uso |
|-------|---------|-----|
| `font-display` | Cormorant Garamond | Títulos, hero, precios |
| `font-sans` | DM Sans | Cuerpo, UI, navegación |

Google Fonts cargadas en `nuxt.config.ts` → `app.head.link`.

## Layout

- `max-w-content` → **1280px** (`BaseContainer`)
- Espaciado horizontal: `px-4 sm:px-6 lg:px-8`

## Sombras

- `shadow-soft` — cards, navbar dropdown
- `shadow-soft-lg` — hover cards, modales

## Border radius

- Botones / inputs: `rounded-xl`
- Cards catálogo: `rounded-xl` (móvil) → `rounded-2xl` (desktop)
- Secciones hero: `rounded-2xl` / `rounded-3xl`
- Pills / badges: `rounded-full`

## Modo oscuro

- Estrategia: `darkMode: 'class'` en Tailwind
- Persistencia: `localStorage` key `lumia-appearance` (Fase 3)
- Overrides: `dark:bg-zinc-950`, `dark:text-zinc-100`

## Componentes base

Ver `app/components/ui/README.md`:
- `BaseButton` — variantes `primary | secondary | ghost`
- `BaseContainer` — ancho máximo editorial
- `BaseCard` — superficie con sombra suave

## Iconos

- Tienda pública: **Tabler Icons** (`@tabler/icons-vue`)
- Tamaño habitual: `h-5 w-5 stroke-[1.25]`
