<template>
  <NuxtLink v-if="to" :to="to" :class="btnClass">
    <slot />
  </NuxtLink>
  <button v-else :type="type" :disabled="disabled" :class="btnClass">
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    to?: string
    type?: 'button' | 'submit'
    block?: boolean
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    type: 'button',
    block: false,
    disabled: false,
  }
)

const btnClass = computed(() => {
  const base = [
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-200 sm:px-6 sm:py-3',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumia-gold/60',
    'disabled:pointer-events-none disabled:opacity-40',
    props.block ? 'w-full' : '',
  ]
  const v = {
    primary:
      'bg-lumia-ink text-lumia-cream shadow-soft hover:bg-lumia-ink/90 hover:shadow-soft-lg active:scale-[0.99]',
    secondary:
      'border border-lumia-ink/12 bg-lumia-cream text-lumia-ink shadow-soft hover:border-lumia-gold/35 hover:bg-lumia-beige/40',
    ghost: 'bg-transparent text-lumia-ink hover:bg-lumia-beige/50',
  }[props.variant]
  return [...base, v].join(' ')
})
</script>
