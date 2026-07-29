# Shell — Layout público

Envoltorio de todas las páginas de la tienda.

## Archivos

| Archivo | Propósito |
|---------|-----------|
| `components/PublicLayout.vue` | Navbar + main + Footer + CartDrawer |

## Uso

Registrado en `app/layouts/default.vue`:

```vue
<PublicLayout>
  <slot />
</PublicLayout>
```

## Estado

- `cartOpen` — controla visibilidad del `CartDrawer`
