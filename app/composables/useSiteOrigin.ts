export function useSiteOrigin() {
  const config = useRuntimeConfig()
  const requestUrl = useRequestURL()

  return computed(() => {
    const configured = String(config.siteUrl || config.public.siteUrl || '').trim().replace(/\/$/, '')
    if (configured) return configured
    if (import.meta.client && typeof window !== 'undefined') {
      return window.location.origin
    }
    return requestUrl.origin
  })
}

export function useCanonicalUrl(path: string) {
  const origin = useSiteOrigin()
  return computed(() => `${origin.value}${path.startsWith('/') ? path : `/${path}`}`)
}
