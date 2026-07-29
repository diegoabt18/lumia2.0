# Layout — Shell de la tienda

Componentes estructurales del layout público.

## Componentes

| Archivo | Propósito |
|---------|-----------|
| `AppNavbar.vue` | Header sticky con logo, nav central, búsqueda, carrito y login. |
| `AppFooter.vue` | Footer oscuro (`bg-lumia-ink`) con links legales y newsletter. |
| `CartDrawer.vue` | Drawer lateral del carrito (Teleport). Estado vacío + líneas con qty. |

## Integración

Usados por `features/shell/components/PublicLayout.vue`:

```
AppNavbar → main (slot) → AppFooter → CartDrawer
```

## Notas

- Sin links a `/admin` (admin vive en proyecto `lumia` local).
- Notificaciones in-app: pendiente Fase 3 (auth).
