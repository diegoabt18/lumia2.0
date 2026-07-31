import type { StoreNotification } from '#shared/types/store-settings'

export function useNotifications() {
  const auth = useAuth()
  const items = useState<StoreNotification[]>('notifications-items', () => [])
  const unreadCount = useState('notifications-unread', () => 0)
  const loaded = useState('notifications-loaded', () => false)
  const pending = ref(false)
  const open = ref(false)

  async function refresh() {
    if (!auth.user.value) {
      items.value = []
      unreadCount.value = 0
      loaded.value = true
      return
    }
    pending.value = true
    try {
      const [listRes, countRes] = await Promise.all([
        $fetch<{ items: StoreNotification[]; unreadCount: number }>('/api/notifications', {
          query: { limit: 20 },
          timeout: 8_000,
        }),
        $fetch<{ unreadCount: number }>('/api/notifications/unread-count', { timeout: 5_000 }),
      ])
      items.value = listRes.items ?? []
      unreadCount.value = countRes.unreadCount ?? listRes.unreadCount ?? 0
    } catch {
      items.value = []
      unreadCount.value = 0
    } finally {
      pending.value = false
      loaded.value = true
    }
  }

  if (import.meta.client) {
    watch(
      () => auth.user.value?.id,
      (id) => {
        if (id) void refresh()
        else {
          items.value = []
          unreadCount.value = 0
        }
      },
      { immediate: true }
    )
  }

  async function markRead(ids: string[]) {
    if (!ids.length) return
    await $fetch('/api/notifications/read', { method: 'PATCH', body: { ids } })
    items.value = items.value.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
    unreadCount.value = Math.max(0, unreadCount.value - ids.length)
  }

  async function markAllRead() {
    await $fetch('/api/notifications/read-all', { method: 'PATCH' })
    items.value = items.value.map((n) => ({ ...n, read: true }))
    unreadCount.value = 0
  }

  async function remove(id: string) {
    await $fetch(`/api/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' })
    const removed = items.value.find((n) => n.id === id)
    items.value = items.value.filter((n) => n.id !== id)
    if (removed && !removed.read) unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  return {
    items: readonly(items),
    unreadCount: readonly(unreadCount),
    loaded: readonly(loaded),
    pending: readonly(pending),
    open,
    refresh,
    markRead,
    markAllRead,
    remove,
  }
}
