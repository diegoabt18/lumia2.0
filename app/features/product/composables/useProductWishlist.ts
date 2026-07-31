import { createSharedComposable } from '@vueuse/core'

const STORAGE_KEY = 'lumia_wishlist_v1'
export const WISHLIST_MAX = 30

function readLocalSlugs(): string[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

function writeLocalSlugs(slugs: string[]) {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(slugs)].slice(0, WISHLIST_MAX)))
}

function clearLocalSlugs() {
  if (!import.meta.client) return
  localStorage.removeItem(STORAGE_KEY)
}

function httpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const status = (error as { statusCode?: number; status?: number }).statusCode
    ?? (error as { status?: number }).status
  return typeof status === 'number' ? status : undefined
}

function applySlugs(current: string[], next: string[]): string[] {
  const prevKey = current.join('\0')
  const nextKey = next.join('\0')
  if (nextKey === prevKey) return current
  return next
}

const useWishlistShared = createSharedComposable(() => {
  const auth = useAuth()
  const slugs = useState<string[]>('wishlist-slugs', () => [])
  const loaded = useState('wishlist-loaded', () => false)
  const pending = ref(false)

  let loadPromise: Promise<void> | null = null

  async function syncLocalToServer() {
    if (!auth.user.value || !import.meta.client) return
    const local = readLocalSlugs()
    if (!local.length) return
    try {
      const res = await $fetch<{ slugs: string[] }>('/api/account/favorites/sync', {
        method: 'POST',
        body: { slugs: local },
      })
      slugs.value = applySlugs(slugs.value, res.slugs ?? [])
      clearLocalSlugs()
    } catch (e) {
      if (httpStatus(e) === 401) await auth.fetchUser()
    }
  }

  async function load(options: { force?: boolean } = {}) {
    if (loadPromise) return loadPromise
    if (loaded.value && !options.force) return loadPromise

    loadPromise = (async () => {
      pending.value = true
      try {
        if (auth.user.value) {
          const res = await $fetch<{ slugs: string[] }>('/api/account/favorites', { timeout: 4_000 })
          slugs.value = applySlugs(slugs.value, res.slugs ?? [])
        } else {
          slugs.value = applySlugs(slugs.value, readLocalSlugs())
        }
      } catch (e) {
        if (httpStatus(e) === 401) {
          await auth.fetchUser()
          if (!auth.user.value) {
            slugs.value = applySlugs(slugs.value, readLocalSlugs())
          }
        } else if (!auth.user.value) {
          slugs.value = applySlugs(slugs.value, readLocalSlugs())
        }
      } finally {
        loaded.value = true
        pending.value = false
        loadPromise = null
      }
    })()

    return loadPromise
  }

  if (import.meta.client) {
    watch(
      () => auth.user.value?.id,
      (id, prev) => {
        loaded.value = false
        if (id && id !== prev) {
          void syncLocalToServer().then(() => load({ force: true }))
        } else if (!id) {
          slugs.value = applySlugs(slugs.value, readLocalSlugs())
          loaded.value = true
        }
      },
    )

    watch(
      () => auth.loaded.value,
      (ready) => {
        if (ready && !loaded.value) void load()
      },
      { immediate: true },
    )
  }

  function isFavorited(productSlug: string) {
    return slugs.value.includes(productSlug)
  }

  async function toggle(productSlug: string): Promise<boolean | null> {
    const slug = productSlug.trim()
    if (!slug || pending.value) return null
    pending.value = true
    try {
      if (auth.user.value) {
        const res = await $fetch<{ favorited: boolean }>('/api/account/favorites/toggle', {
          method: 'POST',
          body: { productSlug: slug },
        })
        if (res.favorited) {
          slugs.value = [slug, ...slugs.value.filter((s) => s !== slug)]
        } else {
          slugs.value = slugs.value.filter((s) => s !== slug)
        }
        return res.favorited
      }

      const next = new Set(readLocalSlugs())
      let favorited: boolean
      if (next.has(slug)) {
        next.delete(slug)
        favorited = false
      } else {
        if (next.size >= WISHLIST_MAX) {
          useToast().error('Máximo 30 favoritos en este dispositivo.')
          return null
        }
        next.add(slug)
        favorited = true
      }
      const list = [...next]
      writeLocalSlugs(list)
      slugs.value = list
      return favorited
    } catch (e) {
      if (httpStatus(e) === 401) await auth.fetchUser()
      return null
    } finally {
      pending.value = false
    }
  }

  return {
    slugs: readonly(slugs),
    loaded: readonly(loaded),
    pending: readonly(pending),
    load,
    toggle,
    isFavorited,
  }
})

export const useWishlist = useWishlistShared

export function useProductWishlist(productSlug: MaybeRefOrGetter<string>) {
  const { isFavorited, toggle, pending } = useWishlist()
  const slug = computed(() => toValue(productSlug))
  const favorited = computed(() => isFavorited(slug.value))

  async function toggleWishlist() {
    return toggle(slug.value)
  }

  return {
    favorited,
    pending,
    toggle: toggleWishlist,
    isLoggedIn: computed(() => Boolean(useAuth().user.value)),
  }
}
