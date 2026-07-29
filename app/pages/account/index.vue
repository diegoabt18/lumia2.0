<template>

  <BaseContainer class="py-16">

    <h1 class="font-display text-3xl text-lumia-ink">Mi cuenta</h1>

    <div v-if="user" class="mt-8 rounded-2xl border border-lumia-ink/8 bg-white/70 p-6 shadow-soft">

      <p class="font-display text-xl text-lumia-ink">{{ user.name }}</p>

      <p class="mt-1 text-sm text-lumia-ink/55">{{ user.email }}</p>

      <BaseButton to="/account/orders" variant="secondary" class="mt-6">Mis pedidos</BaseButton>
      <BaseButton to="/account/favorites" variant="secondary" class="mt-3">Favoritos</BaseButton>
      <BaseButton type="button" variant="ghost" class="mt-3" @click="logout">Cerrar sesión</BaseButton>

    </div>

    <div v-else class="mt-8">

      <p class="text-lumia-ink/60">Inicia sesión para ver tu cuenta.</p>

      <BaseButton to="/auth/login" variant="primary" class="mt-6">Entrar</BaseButton>

    </div>

  </BaseContainer>

</template>



<script setup lang="ts">

const { user, logout } = useAuth()

useHead({ title: 'Mi cuenta — LUMIA' })

</script>

