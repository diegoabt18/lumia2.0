<template>
  <div class="w-full bg-lumia-canvas pb-16 pt-4 md:pb-24">
    <div class="border-b border-lumia-ink/8 bg-lumia-cream/40">
      <BaseContainer class="py-4">
        <AppBreadcrumbs :items="breadcrumbs" />
      </BaseContainer>
    </div>

    <BaseContainer class="py-10 md:py-14">
      <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        <div v-for="n in 3" :key="n" class="h-28 animate-pulse rounded-2xl bg-lumia-beige/60" />
      </div>

      <div v-else-if="category" class="space-y-10">
        <header class="max-w-2xl">
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-lumia-ink/45">Categoría</p>
          <h1 class="mt-2 font-display text-3xl font-medium text-lumia-ink md:text-4xl">{{ category.name }}</h1>
          <p v-if="category.description" class="mt-3 text-sm leading-relaxed text-lumia-ink/65">
            {{ category.description }}
          </p>
        </header>

        <section v-if="category.subcategories.length" aria-labelledby="subcategories-title">
          <h2 id="subcategories-title" class="sr-only">Subcategorías</h2>
          <ul class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <li v-for="sub in category.subcategories" :key="sub.id">
              <NuxtLink
                :to="`/categorias/${encodeURIComponent(category.slug)}/${encodeURIComponent(sub.slug)}`"
                class="group block h-full rounded-2xl border border-lumia-ink/8 bg-lumia-canvas p-5 shadow-soft transition hover:border-lumia-gold/35 hover:shadow-soft-lg sm:p-6"
              >
                <p class="font-display text-lg text-lumia-ink transition group-hover:text-lumia-gold sm:text-xl">
                  {{ sub.name }}
                </p>
                <p v-if="sub.description" class="mt-2 line-clamp-2 text-xs leading-relaxed text-lumia-ink/55">
                  {{ sub.description }}
                </p>
                <p class="mt-3 text-xs text-lumia-ink/45">{{ countLabel(sub.productCount ?? 0) }}</p>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <div
          v-else
          class="rounded-2xl border border-dashed border-lumia-ink/15 bg-lumia-cream/40 px-8 py-16 text-center"
        >
          <p class="font-display text-xl text-lumia-ink/70">Aún no hay subcategorías</p>
          <p class="mt-2 text-sm text-lumia-ink/50">Esta categoría se está preparando. Vuelve pronto.</p>
          <NuxtLink to="/products" class="mt-6 inline-block text-sm font-semibold text-lumia-gold">
            Ver todo el catálogo
          </NuxtLink>
        </div>
      </div>
    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import type { CategoryWithSubcategories } from '#shared/types/category'

const route = useRoute()
const categorySlug = computed(() => String(route.params.category ?? ''))

const { data, status, error } = await useAsyncData(
  () => `storefront-category-${categorySlug.value}`,
  () =>
    $fetch<{ category: CategoryWithSubcategories }>(
      `/api/categories/${encodeURIComponent(categorySlug.value)}`,
    ),
)

// Categoría inexistente o inactiva: 404 real. Otros fallos (API caída) no se disfrazan de 404.
if (error.value) {
  const notFound = error.value.statusCode === 404
  throw createError({
    statusCode: notFound ? 404 : 503,
    statusMessage: notFound ? 'Categoría no encontrada' : 'Catálogo no disponible',
    fatal: true,
  })
}

const pending = computed(() => status.value === 'pending')
const category = computed(() => data.value?.category ?? null)

const breadcrumbs = computed(() => [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/products' },
  { label: category.value?.name ?? 'Categoría' },
])

function countLabel(n: number) {
  if (n === 0) return 'Próximamente'
  return n === 1 ? '1 producto' : `${n} productos`
}

useHead(() => ({
  title: category.value ? `${category.value.name} — LUMIA` : 'Categoría — LUMIA',
  meta: category.value?.description
    ? [{ name: 'description', content: category.value.description }]
    : [],
}))
</script>
