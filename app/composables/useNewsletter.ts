import type { NotificationPreferences } from '#shared/types/store-settings'

/** Preferencias por defecto, igual que en Mi cuenta. */
const DEFAULT_PREFS: NotificationPreferences = {
  promotions: true,
  orderStatus: true,
  newProducts: false,
  newsletter: false,
}

/**
 * Suscripción al newsletter de un usuario con sesión. Se guarda en sus preferencias de notificación.
 * El PATCH de preferencias reemplaza el objeto completo, por eso siempre se envían todas las claves.
 */
export function useNewsletter() {
  const { user, fetchUser } = useAuth()

  const subscribed = computed(() => Boolean(user.value?.notificationPreferences?.newsletter))

  async function setSubscribed(value: boolean) {
    const current: NotificationPreferences = {
      ...DEFAULT_PREFS,
      ...(user.value?.notificationPreferences ?? {}),
    }
    await $fetch('/api/account/preferences', {
      method: 'PATCH',
      body: { notificationPreferences: { ...current, newsletter: value } },
    })
    await fetchUser({ force: true })
  }

  return { subscribed, setSubscribed }
}
