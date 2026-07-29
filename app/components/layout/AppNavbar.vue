<template>
  <header
    class="sticky top-0 z-50 border-b border-lumia-ink/8 bg-lumia-canvas/90 backdrop-blur-md transition-all duration-200 dark:border-white/10 dark:bg-zinc-950/90"
  >
    <BaseContainer>
      <div class="relative flex h-16 items-center justify-between gap-3 sm:h-[4.5rem] lg:h-20">
        <div class="flex min-w-0 flex-1 items-center pr-1 sm:pr-2">
          <NuxtLink
            to="/"
            class="font-display text-2xl font-semibold tracking-[0.2em] text-lumia-ink transition-opacity hover:opacity-90 sm:text-3xl"
          >
            LUMIA
          </NuxtLink>
        </div>

        <nav
          class="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-10 lg:flex"
          aria-label="Principal"
        >
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="relative text-sm font-medium text-lumia-ink/70 transition-colors duration-200 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-lumia-gold after:transition-transform after:duration-200 hover:text-lumia-ink hover:after:scale-x-100 dark:text-zinc-300 dark:hover:text-white"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="flex shrink-0 items-center gap-1 sm:gap-2">
          <NuxtLink
            to="/products"
            class="flex h-10 w-10 items-center justify-center rounded-full text-lumia-ink/70 transition-colors hover:bg-lumia-beige/50 hover:text-lumia-ink"
            aria-label="Buscar catálogo"
          >
            <IconSearch class="h-5 w-5 stroke-[1.25]" />
          </NuxtLink>

          <button
            type="button"
            class="relative flex h-10 w-10 items-center justify-center rounded-full text-lumia-ink/70 transition-colors hover:bg-lumia-beige/50 hover:text-lumia-ink"
            aria-label="Carrito"
            @click="$emit('open-cart')"
          >
            <IconShoppingBag class="h-5 w-5 stroke-[1.25]" />
            <span
              v-if="cartCount > 0"
              class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-lumia-gold px-1 text-[10px] font-semibold text-lumia-ink"
            >
              {{ cartCount > 99 ? '99+' : cartCount }}
            </span>
          </button>

          <ClientOnly>
            <div v-if="isHydrated && !auth.user.value" class="hidden items-center gap-2 sm:flex">
              <NuxtLink
                :to="loginHref"
                class="rounded-full bg-lumia-ink px-4 py-2 text-sm font-medium text-lumia-cream transition-transform hover:scale-[1.02]"
              >
                Entrar
              </NuxtLink>
            </div>
            <div v-else-if="isHydrated && auth.user.value" class="hidden sm:block">
              <NuxtLink
                to="/account"
                class="rounded-full border border-lumia-ink/15 px-4 py-2 text-sm font-medium text-lumia-ink/85 transition-colors hover:border-lumia-gold/40"
              >
                Mi cuenta
              </NuxtLink>
            </div>
          </ClientOnly>

          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full text-lumia-ink md:hidden"
            aria-label="Menú"
            @click="mobileOpen = !mobileOpen"
          >
            <IconMenu2 v-if="!mobileOpen" class="h-6 w-6 stroke-[1.25]" />
            <IconX v-else class="h-6 w-6 stroke-[1.25]" />
          </button>
        </div>
      </div>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="mobileOpen" class="border-t border-lumia-ink/8 py-2 md:hidden">
          <nav class="flex flex-col">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="flex min-h-11 items-center px-4 text-sm font-medium text-lumia-ink/80 hover:bg-lumia-beige/30"
              @click="mobileOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
            <NuxtLink
              :to="loginHref"
              class="flex min-h-11 items-center px-4 text-sm font-medium hover:bg-lumia-beige/30"
              @click="mobileOpen = false"
            >
              Entrar
            </NuxtLink>
          </nav>
        </div>
      </Transition>
    </BaseContainer>
  </header>
</template>

<script setup lang="ts">
import { IconShoppingBag, IconSearch, IconMenu2, IconX } from '@tabler/icons-vue'

defineEmits<{ (e: 'open-cart'): void }>()

const auth = useAuth()
const route = useRoute()
const cart = useCart()
const cartCount = computed(() => cart.count.value)

const loginHref = computed(() => {
  const p = route.path
  if (p.startsWith('/auth/login')) return '/auth/login'
  return { path: '/auth/login', query: { redirect: route.fullPath } }
})

const navLinks = [
  { to: '/products', label: 'Catálogo' },
  { to: '/#colecciones', label: 'Colecciones' },
  { to: '/#historia', label: 'Historia' },
]

const mobileOpen = ref(false)
const isHydrated = ref(false)

onMounted(() => {
  isHydrated.value = true
})
</script>
