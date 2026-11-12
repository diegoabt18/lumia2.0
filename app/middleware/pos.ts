/**
 * Acceso al POS: quien puede crear ventas (orders.create). Las acciones de cobro y abono
 * exigen además orders.update (ver pages/admin/pos.vue). El Server vuelve a autorizar cada petición.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, loaded, fetchUser, can } = useAuth()

  if (!loaded.value) {
    await fetchUser()
  }

  if (!user.value) {
    return navigateTo(`/auth/login?return=${encodeURIComponent(to.fullPath)}`)
  }

  if (!can('orders.create')) {
    return navigateTo('/')
  }
})
