<template>
  <div class="min-h-screen bg-lumia-canvas">
    <header class="border-b border-lumia-ink/8 bg-white/80 backdrop-blur-md">
      <BaseContainer class="flex flex-wrap items-center justify-between gap-4 py-4">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-lumia-gold/80">Admin</p>
          <h1 class="font-display text-xl text-lumia-ink">Panel de migración</h1>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span v-if="user" class="hidden text-sm text-lumia-ink/55 sm:inline">{{ user.email }}</span>
          <BaseButton to="/" variant="ghost">Tienda</BaseButton>
          <BaseButton variant="secondary" @click="logout">Salir</BaseButton>
        </div>
      </BaseContainer>
    </header>
    <main class="py-8 sm:py-10">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()
</script>
