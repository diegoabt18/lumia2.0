<template>
  <section ref="rootEl" class="mt-20 border-t border-lumia-ink/8 pt-16">
    <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">Opiniones</p>

    <div v-if="pending && !data" class="mt-8 space-y-4">
      <div class="h-24 animate-pulse rounded-2xl bg-lumia-beige/50" />
      <div class="h-32 animate-pulse rounded-2xl bg-lumia-beige/40" />
    </div>

    <div v-else-if="ratingCount > 0" class="mt-8 space-y-6">
      <div class="rounded-2xl border border-lumia-ink/10 bg-white p-5">
        <div class="flex flex-wrap items-end gap-3">
          <span class="font-display text-3xl font-semibold text-lumia-ink">{{ ratingAverage.toFixed(1) }}</span>
          <div class="flex gap-0.5 text-lumia-gold" aria-hidden="true">
            <span v-for="n in 5" :key="n" class="text-sm">{{ starChar(n, ratingAverage) }}</span>
          </div>
          <span class="text-sm text-lumia-ink/55">({{ ratingCount }} reseñas)</span>
        </div>
      </div>

      <article
        v-for="review in reviews"
        :key="review.id"
        class="rounded-2xl border border-lumia-ink/10 bg-white p-5"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-lumia-ink">{{ review.userName }}</p>
            <span
              v-if="review.verifiedPurchase"
              class="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
            >
              Compra verificada
            </span>
          </div>
          <span class="text-xs text-lumia-ink/45">{{ formatReviewDate(review.createdAt) }}</span>
        </div>
        <div class="mt-1 flex gap-0.5 text-lumia-gold" aria-hidden="true">
          <span v-for="n in 5" :key="n" class="text-xs">{{ starChar(n, review.stars) }}</span>
        </div>
        <p v-if="review.title" class="mt-2 text-sm font-medium text-lumia-ink">{{ review.title }}</p>
        <p class="mt-1 text-sm leading-relaxed text-lumia-ink/75">{{ review.body }}</p>
      </article>

      <BaseButton
        v-if="canLoadMore"
        type="button"
        variant="ghost"
        class="w-full"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? 'Cargando...' : 'Ver más reseñas' }}
      </BaseButton>
    </div>

    <p v-else-if="!pending" class="mt-8 text-sm text-lumia-ink/50">
      Aún no hay reseñas para este producto.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { ProductFeedbackReview } from '#shared/types/product-feedback'

const props = defineProps<{
  slug: string
  initialAverage?: number | null
  initialCount?: number | null
}>()

const rootEl = ref<HTMLElement | null>(null)
const shouldLoad = ref(false)
const page = ref(1)
const loadingMore = ref(false)
const allReviews = ref<ProductFeedbackReview[]>([])

const { formatStoreDate } = useUtils()

type FeedbackPayload = {
  rating: { average: number; count: number }
  reviews: ProductFeedbackReview[]
  pagination: { page: number; pages: number; total: number }
}

const { data, pending, refresh } = useAsyncData(
  () => `pdp-feedback-${props.slug}`,
  async () => {
    if (!shouldLoad.value) return null
    return $fetch<FeedbackPayload>(`/api/products/${encodeURIComponent(props.slug)}/feedback`, {
      query: { page: page.value, limit: 8 },
    })
  },
  { watch: [shouldLoad, page], server: false, immediate: false }
)

watch(data, (payload) => {
  if (!payload) return
  if (page.value === 1) allReviews.value = payload.reviews
  else allReviews.value = [...allReviews.value, ...payload.reviews]
})

const ratingAverage = computed(() => data.value?.rating.average ?? props.initialAverage ?? 0)
const ratingCount = computed(() => data.value?.rating.count ?? props.initialCount ?? 0)
const reviews = computed(() => allReviews.value)
const canLoadMore = computed(() => {
  const p = data.value?.pagination
  return Boolean(p && p.page < p.pages)
})

function starChar(n: number, rating: number) {
  return n <= Math.round(rating) ? '★' : '☆'
}

function formatReviewDate(raw: string | Date) {
  const d = raw instanceof Date ? raw : new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  return formatStoreDate(d.toISOString(), 'medium')
}

async function loadMore() {
  loadingMore.value = true
  page.value += 1
  try {
    await refresh()
  } finally {
    loadingMore.value = false
  }
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        shouldLoad.value = true
        observer.disconnect()
        void refresh()
      }
    },
    { rootMargin: '120px' }
  )
  if (rootEl.value) observer.observe(rootEl.value)
  onUnmounted(() => observer.disconnect())
})
</script>
