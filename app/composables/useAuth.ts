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

  async function fetchUser() {
    try {
      const res = await $fetch<{ user: AuthUser | null }>('/api/auth/me')
      user.value = res.user
    } catch {
      user.value = null
    } finally {
      loaded.value = true
    }
  }

  if (import.meta.client && !loaded.value) {
    void fetchUser()
  }

  function loginWithGoogle(returnPath = '/') {
    const path = returnPath.startsWith('/') ? returnPath : '/'
    navigateTo(`/api/auth/google?return=${encodeURIComponent(path)}`, { external: true })
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
