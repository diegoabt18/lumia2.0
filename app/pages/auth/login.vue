<template>
  <BaseContainer class="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
    <h1 class="font-display text-3xl text-lumia-ink">Iniciar sesión</h1>
    <p class="mt-4 max-w-md text-lumia-ink/60">
      Accede con tu cuenta de Google para guardar tu carrito y completar pedidos.
    </p>
    <BaseButton type="button" variant="primary" class="mt-8" @click="onGoogleLogin">
      Continuar con Google
    </BaseButton>
    <BaseButton to="/products" variant="ghost" class="mt-4">Explorar catálogo</BaseButton>
  </BaseContainer>
</template>

<script setup lang="ts">
import { loginErrorToastMessage } from '#shared/auth/login-errors'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { loginWithGoogle } = useAuth()

onMounted(() => {
  const err = route.query.error
  if (typeof err !== 'string' || !err.trim()) return

  toast.error(loginErrorToastMessage(err.trim()))

  const nextQuery: Record<string, string> = {}
  if (typeof route.query.return === 'string') nextQuery.return = route.query.return
  if (typeof route.query.redirect === 'string') nextQuery.redirect = route.query.redirect

  router.replace({ path: route.path, query: nextQuery })
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
