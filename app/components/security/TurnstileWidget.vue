<template>
  <div ref="containerRef" class="min-h-[65px]" aria-label="Verificación de seguridad" />
</template>

<script setup lang="ts">
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
        }
      ) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
    }
  }
}

const props = withDefaults(
  defineProps<{
    siteKey: string
    theme?: 'light' | 'dark' | 'auto'
  }>(),
  { theme: 'auto' }
)

const emit = defineEmits<{
  token: [string | null]
}>()

const containerRef = ref<HTMLElement | null>(null)
let widgetId: string | null = null
let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (import.meta.server) return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile="1"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.turnstile = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Turnstile script failed'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

onMounted(async () => {
  if (!props.siteKey?.trim() || !containerRef.value) return

  try {
    await loadTurnstileScript()
    if (!window.turnstile || !containerRef.value) return

    widgetId = window.turnstile.render(containerRef.value, {
      sitekey: props.siteKey.trim(),
      theme: props.theme,
      callback: (token) => emit('token', token),
      'expired-callback': () => emit('token', null),
      'error-callback': () => emit('token', null),
    })
  } catch {
    emit('token', null)
  }
})

onBeforeUnmount(() => {
  if (widgetId && window.turnstile) {
    window.turnstile.remove(widgetId)
  }
})

defineExpose({
  reset() {
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId)
      emit('token', null)
    }
  },
})
</script>
