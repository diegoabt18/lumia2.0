<template>
  <div class="min-h-screen bg-lumia-canvas">
    <header class="border-b border-lumia-ink/8 bg-white/80 backdrop-blur-md">
      <BaseContainer class="flex flex-wrap items-center justify-between gap-4 py-4">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-lumia-gold/80">Admin</p>
          <h1 class="font-display text-xl text-lumia-ink">{{ pageTitle }}</h1>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span v-if="user" class="hidden text-sm text-lumia-ink/55 sm:inline">{{ user.email }}</span>
          <BaseButton to="/" variant="ghost">Tienda</BaseButton>
          <BaseButton variant="secondary" @click="logout">Salir</BaseButton>
        </div>
      </BaseContainer>
      <BaseContainer class="pb-3">
        <nav class="flex flex-wrap gap-2" aria-label="Secciones admin">
          <NuxtLink
            v-for="link in adminLinks"
            :key="link.to"
            :to="link.to"
            class="rounded-full px-4 py-2 text-sm font-medium transition"
            :class="
              isActive(link.to)
                ? 'bg-lumia-ink text-lumia-cream'
                : 'bg-lumia-cream/50 text-lumia-ink/70 hover:bg-lumia-beige/60 hover:text-lumia-ink'
            "
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </BaseContainer>
    </header>
    <main class="py-8 sm:py-10">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { user, logout } = useAuth()

const adminLinks = [{ to: '/admin/design-system', label: 'Design system' }]

const pageTitle = computed(() => {
  if (route.path.startsWith('/admin/design-system')) return 'Sistema de diseño'
  return 'Administración'
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>
