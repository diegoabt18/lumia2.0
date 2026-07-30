interface AuthUser {
  id: string
  name: string
  email?: string
  avatar?: string
  role: 'user' | 'admin'
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const loaded = useState('auth-loaded', () => false)
  const localProviderEnabled = computed(() => useRuntimeConfig().public.authLocalProviderEnabled)

  let fetchPromise: Promise<void> | null = null

  async function fetchUser() {
    if (fetchPromise) return fetchPromise
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

  if (import.meta.client && !loaded.value) {
    scheduleIdle(() => fetchUser())
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
}
