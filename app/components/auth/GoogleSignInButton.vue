<template>
  <button
    type="button"
    class="google-sign-in-btn"
    :class="[block && 'w-full', size === 'lg' && 'google-sign-in-btn--lg']"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <span class="google-sign-in-btn__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px]">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    </span>
    <span class="google-sign-in-btn__label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    block?: boolean
    disabled?: boolean
    size?: 'md' | 'lg'
  }>(),
  {
    label: 'Continuar con Google',
    block: false,
    disabled: false,
    size: 'md',
  }
)

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<style scoped>
.google-sign-in-btn {
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border-radius: 9999px;
  border: 1px solid #dadce0;
  background: #fff;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  color: #3c4043;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.08);
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;
}

.google-sign-in-btn--lg {
  min-height: 48px;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  font-size: 0.9375rem;
}

.google-sign-in-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #d2e3fc;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.12);
}

.google-sign-in-btn:active:not(:disabled) {
  transform: scale(0.985);
  box-shadow: 0 1px 1px rgba(60, 64, 67, 0.1);
}

.google-sign-in-btn:focus-visible {
  outline: 2px solid #4285f4;
  outline-offset: 2px;
}

.google-sign-in-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.google-sign-in-btn__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.google-sign-in-btn__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 360px) {
  .google-sign-in-btn {
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }

  .google-sign-in-btn__label {
    white-space: normal;
    line-height: 1.2;
    text-align: center;
  }
}
</style>
