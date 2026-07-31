import { createSharedComposable } from '@vueuse/core'

interface AuthUser {
  id: string
  name: string
  nickname?: string
  email?: string
  avatar?: string
  role: 'user' | 'admin'
  notificationPreferences?: {
    promotions?: boolean
    orderStatus?: boolean
    newProducts?: boolean
  }
}

const useAuthShared = createSharedComposable(() => {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const loaded = useState('auth-loaded', () => false)
  const initStarted = useState('auth-init-started', () => false)
  const localProviderEnabled = computed(() => useRuntimeConfig().public.authLocalProviderEnabled)

  let fetchPromise: Promise<void> | null = null

  async function fetchUser(options?: { force?: boolean }) {
    if (fetchPromise) return fetchPromise
    if (loaded.value && !options?.force) return Promise.resolve()

    fetchPromise = (async () => {
      try {
        const res = await $fetch<{ user: AuthUser | null }>('/api/auth/me')
        user.value = res.user
      } catch {
        user.value = null
      } finally {
        loaded.value = true
        fetchPromise = null
      }
    })()

    return fetchPromise
  }

  if (import.meta.client && !initStarted.value) {
    initStarted.value = true
    scheduleIdle(() => void fetchUser())
  }

  function loginWithGoogle(returnPath = '/', turnstileToken?: string) {
    const path = returnPath.startsWith('/') ? returnPath : '/'
    const params = new URLSearchParams({ return: path })
    if (turnstileToken?.trim()) params.set('turnstile', turnstileToken.trim())
    navigateTo(`/api/auth/google?${params.toString()}`, { external: true })
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    loaded.value = true
    await navigateTo('/')
  }

  return {
    user,
    loaded,
    localProviderEnabled,
    fetchUser,
    loginWithGoogle,
    logout,
  }
})

export const useAuth = useAuthShared
