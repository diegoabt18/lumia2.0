<template>
  <BaseContainer class="flex min-h-[60vh] flex-col items-center justify-center py-16">
    <div class="w-full max-w-md rounded-2xl border border-lumia-ink/8 bg-white p-8 text-center shadow-soft md:p-10">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lumia-cream/80 ring-1 ring-lumia-gold/20">
        <span class="font-display text-2xl text-lumia-gold" aria-hidden="true">✦</span>
      </div>

      <h1 class="mt-6 font-display text-3xl text-lumia-ink">Iniciar sesión</h1>
      <p class="mt-3 text-sm leading-relaxed text-lumia-ink/60">
        Accede con tu cuenta de Google para guardar tu carrito y el historial de pedidos.
      </p>

      <SecurityTurnstileWidget
        v-if="turnstileSiteKey"
        ref="turnstileRef"
        :site-key="turnstileSiteKey"
        class="mt-6"
        @token="onTurnstileToken"
      />

      <GoogleSignInButton
        block
        size="lg"
        class="mt-6"
        :disabled="turnstileSiteKey ? !turnstileToken : false"
        @click="onGoogleLogin"
      />

      <p v-if="turnstileSiteKey && !turnstileToken" class="mt-3 text-xs text-lumia-ink/45">
        Completa la verificación de seguridad para continuar.
      </p>
      <p v-else class="mt-4 text-[11px] leading-relaxed text-lumia-ink/45">
        Solo usamos tu nombre y correo para identificar tu cuenta en LUMIA.
      </p>

      <div class="mt-8 border-t border-lumia-ink/8 pt-6">
        <BaseButton to="/products" variant="ghost" block>Explorar catálogo</BaseButton>
      </div>
    </div>
  </BaseContainer>
</template>

<script setup lang="ts">
import { loginErrorToastMessage } from '#shared/auth/login-errors'
import SecurityTurnstileWidget from '~/components/security/TurnstileWidget.vue'

const config = useRuntimeConfig()
const turnstileSiteKey = computed(() => String(config.public.turnstileSiteKey || '').trim())

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { loginWithGoogle } = useAuth()

const turnstileToken = ref<string | null>(null)
const turnstileRef = ref<InstanceType<typeof SecurityTurnstileWidget> | null>(null)

function onTurnstileToken(token: string | null) {
  turnstileToken.value = token
}

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
  if (turnstileSiteKey.value && !turnstileToken.value) {
    toast.error('Completa la verificación de seguridad.')
    return
  }

  const ret =
    (typeof route.query.return === 'string' && route.query.return) ||
    (typeof route.query.redirect === 'string' && route.query.redirect) ||
    '/'
  loginWithGoogle(ret, turnstileToken.value ?? undefined)
}

useHead({ title: 'Entrar — LUMIA' })
</script>
