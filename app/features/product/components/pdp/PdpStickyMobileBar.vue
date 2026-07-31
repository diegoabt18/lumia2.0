<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  thumbSrc: string
  title: string
  priceLabel: string
  variantLabel: string
  addDisabled?: boolean
  addPending?: boolean
  addLabel?: string
  buyPending?: boolean
}>()

const emit = defineEmits<{
  'add-cart': []
  'buy-now': []
}>()

const canTeleport = ref(false)
onMounted(() => {
  canTeleport.value = true
})
onBeforeUnmount(() => {
  canTeleport.value = false
})
</script>

<template>
  <Teleport v-if="canTeleport" to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-x-0 bottom-0 z-40 border-t border-lumia-ink/10 bg-lumia-canvas/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_32px_rgba(43,43,43,0.08)] backdrop-blur-xl lg:hidden"
      >
        <div class="mx-auto flex max-w-lg items-center gap-3">
          <ProductShopImage :src="thumbSrc" :alt="title" class="h-14 w-11 shrink-0 rounded-lg object-cover" sizes="56px" loading="lazy" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-display text-sm font-medium text-lumia-ink">{{ title }}</p>
            <p class="truncate text-xs text-lumia-ink/50">{{ variantLabel }}</p>
            <p class="font-display text-base text-lumia-ink">{{ priceLabel }}</p>
          </div>
          <div class="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              class="min-h-11 rounded-xl bg-lumia-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-lumia-cream transition hover:bg-lumia-ink/90 disabled:opacity-40"
              :disabled="addDisabled || addPending || buyPending"
              @click="emit('add-cart')"
            >
              <span v-if="addPending" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-lumia-cream border-t-transparent" />
              <span v-else-if="addLabel">{{ addLabel }}</span>
              <span v-else>Añadir</span>
            </button>
            <button
              type="button"
              class="min-h-11 rounded-xl border border-lumia-ink/15 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-lumia-ink transition hover:bg-lumia-cream/50 disabled:opacity-40"
              :disabled="addDisabled || addPending || buyPending"
              @click="emit('buy-now')"
            >
              <span v-if="buyPending" class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-lumia-ink border-t-transparent" />
              <span v-else>Comprar</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
