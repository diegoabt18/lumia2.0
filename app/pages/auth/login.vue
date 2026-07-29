<template>
  <BaseContainer class="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
    <h1 class="font-display text-3xl text-lumia-ink">Iniciar sesión</h1>
    <p class="mt-4 max-w-md text-lumia-ink/60">
      Accede con tu cuenta de Google para guardar tu carrito y completar pedidos.
    </p>
    <p v-if="errorMessage" class="mt-4 text-sm text-rose-600">{{ errorMessage }}</p>
    <BaseButton type="button" variant="primary" class="mt-8" @click="onGoogleLogin">
      Continuar con Google
    </BaseButton>
    <BaseButton to="/products" variant="ghost" class="mt-4">Explorar catálogo</BaseButton>
  </BaseContainer>
</template>

<script setup lang="ts">
const route = useRoute()
const { loginWithGoogle } = useAuth()

const errorMessage = computed(() => {
  const err = route.query.error
  if (!err || typeof err !== 'string') return ''
  const map: Record<string, string> = {
    oauth_state: 'La sesión de Google expiró. Intenta de nuevo.',
    google_config: 'Google OAuth no está configurado en el servidor.',
    auth_db: 'Base de datos de usuarios no disponible.',
    google_token: 'No se pudo validar la respuesta de Google.',
    google_user: 'No se pudo obtener tu perfil de Google.',
    oauth_server: 'Error interno al completar el login. Revisa Mongo auth y vuelve a intentar.',
  }
  return map[err] ?? 'No se pudo iniciar sesión. Intenta de nuevo.'
})

function onGoogleLogin() {
  const ret =
    (typeof route.query.return === 'string' && route.query.return) ||
    (typeof route.query.redirect === 'string' && route.query.redirect) ||
    '/'
  loginWithGoogle(ret)
}

useHead({ title: 'Entrar — LUMIA' })
</script>
