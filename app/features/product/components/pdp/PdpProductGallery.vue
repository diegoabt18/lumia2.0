<script setup lang="ts">
import type { PdpGallerySlide } from '../../types/pdp'

const props = defineProps<{
  slides: PdpGallerySlide[]
  productName: string
  probing?: boolean
}>()

const emit = defineEmits<{
  'open-lightbox': [index: number]
}>()

const activeIndex = ref(0)

watch(
  () => props.slides,
  (list) => {
    if (!list.length) return
    if (activeIndex.value >= list.length) activeIndex.value = 0
  },
  { deep: true }
)

const mobileScrollRef = ref<HTMLElement | null>(null)

function scrollMobileTo(i: number) {
  const el = mobileScrollRef.value
  if (!el || !el.children[i]) return
  const child = el.children[i] as HTMLElement
  el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
}

watch(activeIndex, (i) => {
  if (import.meta.client && window.matchMedia('(max-width: 1023px)').matches) {
    scrollMobileTo(i)
  }
})

function onMobileScroll() {
  const el = mobileScrollRef.value
  if (!el || !props.slides.length) return
  const n = el.children.length
  if (!n) return
  const slideW = el.scrollWidth / n
  if (slideW <= 0) return
  const i = Math.round(el.scrollLeft / slideW)
  activeIndex.value = Math.max(0, Math.min(i, props.slides.length - 1))
}

function selectThumb(i: number) {
  activeIndex.value = i
  scrollMobileTo(i)
}

const current = computed(() => props.slides[activeIndex.value] ?? props.slides[0])
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row lg:gap-5">
    <div
      class="hidden shrink-0 justify-center gap-2 lg:flex lg:w-[4.5rem] lg:flex-col lg:justify-start lg:gap-3"
      aria-label="Miniaturas"
    >
      <button
        v-for="(s, i) in slides"
        :key="s.id"
        type="button"
        class="group relative aspect-[3/4] w-full overflow-hidden rounded-xl border bg-lumia-beige/30 transition-all duration-300"
        :class="
          i === activeIndex
            ? 'border-lumia-ink/25 ring-2 ring-lumia-gold/40 ring-offset-2 ring-offset-lumia-canvas'
            : 'border-lumia-ink/8 hover:border-lumia-ink/20'
        "
        @click="selectThumb(i)"
      >
        <ProductShopImage
          :src="s.thumb"
          :alt="s.alt"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="72px"
          loading="lazy"
        />
      </button>
      <div v-if="probing" class="flex justify-center py-1">
        <span class="h-1 w-8 animate-pulse rounded-full bg-lumia-beige" aria-hidden="true" />
      </div>
    </div>

    <div class="relative min-w-0 flex-1">
      <button
        type="button"
        class="group relative hidden w-full overflow-hidden rounded-2xl bg-lumia-beige/40 shadow-soft lg:block"
        @click="emit('open-lightbox', activeIndex)"
      >
        <div class="aspect-[3/4] overflow-hidden">
          <ProductShopImage
            v-if="current"
            :src="current.src"
            :alt="productName"
            class="h-full w-full origin-center object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="eager"
            fetchpriority="high"
          />
        </div>
        <span class="pointer-events-none absolute bottom-4 right-4 rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-lumia-ink/70 backdrop-blur-sm">
          Pantalla completa
        </span>
      </button>

      <div class="lg:hidden">
        <div
          ref="mobileScrollRef"
          class="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl bg-lumia-beige/40 shadow-soft [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          @scroll.passive="onMobileScroll"
        >
          <button
            v-for="(s, i) in slides"
            :key="s.id"
            type="button"
            class="min-w-full shrink-0 snap-center flex-[0_0_100%] border-0 bg-transparent p-0 text-left"
            @click="emit('open-lightbox', i)"
          >
            <div class="aspect-[3/4] w-full overflow-hidden">
              <ProductShopImage
                :src="s.src"
                :alt="`${productName} · ${s.alt}`"
                class="h-full w-full object-cover"
                sizes="100vw"
                :loading="i === 0 ? 'eager' : 'lazy'"
                :fetchpriority="i === 0 ? 'high' : undefined"
              />
            </div>
          </button>
        </div>
        <div v-if="slides.length > 1" class="mt-4 flex justify-center gap-1.5">
          <button
            v-for="(_, i) in slides"
            :key="i"
            type="button"
            class="h-1.5 rounded-full transition-all duration-300"
            :class="i === activeIndex ? 'w-6 bg-lumia-ink' : 'w-1.5 bg-lumia-ink/20'"
            :aria-label="`Imagen ${i + 1}`"
            @click="selectThumb(i)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
