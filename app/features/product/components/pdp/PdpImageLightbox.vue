<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { IconChevronLeft, IconChevronRight, IconMinus, IconPlus, IconX } from '@tabler/icons-vue'
import type { PdpGallerySlide } from '../../types/pdp'

const props = defineProps<{
  slides: PdpGallerySlide[]
  modelValue: boolean
  startIndex?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const index = ref(0)
const zoom = ref(1)
const canTeleport = ref(false)

watch(
  () => props.startIndex,
  (v) => {
    if (v != null && v >= 0 && v < props.slides.length) index.value = v
  },
  { immediate: true }
)

watch(open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    const s = props.startIndex
    if (s != null && s >= 0 && s < props.slides.length) index.value = s
    zoom.value = 1
  } else {
    document.body.style.overflow = ''
  }
})

function close() {
  open.value = false
}

function prev() {
  const n = props.slides.length
  if (!n) return
  index.value = (index.value - 1 + n) % n
  zoom.value = 1
}

function next() {
  const n = props.slides.length
  if (!n) return
  index.value = (index.value + 1) % n
  zoom.value = 1
}

function onKey(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

let touchStartX = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0]?.clientX ?? 0
}

function onTouchEnd(e: TouchEvent) {
  const x = e.changedTouches[0]?.clientX ?? 0
  const d = x - touchStartX
  if (Math.abs(d) < 48) return
  if (d < 0) next()
  else prev()
}

const current = computed(() => props.slides[index.value])

onMounted(() => {
  canTeleport.value = true
  useEventListener(window, 'keydown', onKey)
})

onBeforeUnmount(() => {
  canTeleport.value = false
  open.value = false
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport v-if="canTeleport" to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex flex-col bg-black/75 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        @click.self="close"
      >
        <div class="flex items-center justify-between px-4 py-3 text-white/90">
          <p class="truncate text-xs font-medium uppercase tracking-[0.25em] text-white/70">
            {{ index + 1 }} / {{ slides.length }}
          </p>
          <div class="flex items-center gap-2">
            <button type="button" class="rounded-full p-2 transition hover:bg-white/10" aria-label="Alejar" @click="zoom = Math.max(1, zoom - 0.25)">
              <IconMinus class="h-5 w-5" />
            </button>
            <button type="button" class="rounded-full p-2 transition hover:bg-white/10" aria-label="Acercar" @click="zoom = Math.min(2.5, zoom + 0.25)">
              <IconPlus class="h-5 w-5" />
            </button>
            <button type="button" class="rounded-full p-2 transition hover:bg-white/10" aria-label="Cerrar" @click="close">
              <IconX class="h-6 w-6" />
            </button>
          </div>
        </div>

        <div
          class="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-2 pb-16 pt-2 sm:px-8"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        >
          <button
            type="button"
            class="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/20 md:block"
            aria-label="Anterior"
            @click.stop="prev"
          >
            <IconChevronLeft class="h-7 w-7" />
          </button>

          <div
            class="relative flex max-h-[min(78vh,860px)] max-w-[min(96vw,920px)] items-center justify-center overflow-hidden"
            :style="{ transform: `scale(${zoom})`, transition: 'transform 0.25s ease-out' }"
          >
            <ProductShopImage
              v-if="current"
              :src="current.src"
              alt=""
              class="max-h-[min(78vh,860px)] w-auto max-w-full object-contain"
              sizes="100vw"
            />
          </div>

          <button
            type="button"
            class="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/20 md:block"
            aria-label="Siguiente"
            @click.stop="next"
          >
            <IconChevronRight class="h-7 w-7" />
          </button>
        </div>

        <div class="flex justify-center gap-2 border-t border-white/10 px-4 py-4">
          <button
            v-for="(s, i) in slides"
            :key="s.id"
            type="button"
            class="h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 ring-transparent transition"
            :class="i === index ? 'ring-lumia-gold' : 'opacity-70 hover:opacity-100'"
            @click="index = i"
          >
            <ProductShopImage :src="s.thumb" :alt="s.alt" class="h-full w-full object-cover" sizes="56px" loading="lazy" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
