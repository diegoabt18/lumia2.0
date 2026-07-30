export default defineNuxtRouteMiddleware(async (to) => {
  const { user, loaded, fetchUser } = useAuth()

  if (!loaded.value) {
    await fetchUser()
  }

  if (!user.value) {
    const returnPath = encodeURIComponent(to.fullPath)
    return navigateTo(`/auth/login?return=${returnPath}`)
  }

  if (user.value.role !== 'admin') {
    return navigateTo('/')
  }
})
