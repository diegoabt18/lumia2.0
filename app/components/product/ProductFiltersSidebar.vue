<template>
  <aside
    class="w-full shrink-0 rounded-2xl border border-lumia-ink/8 bg-lumia-canvas px-5 py-6 text-sm text-lumia-ink shadow-soft"
  >
    <div class="flex items-center justify-between gap-2">
      <h2 class="font-display text-lg font-medium text-lumia-ink">{{ title }}</h2>
      <button
        v-if="hasActiveFilters"
        type="button"
        class="text-xs font-semibold text-lumia-gold hover:underline"
        @click="$emit('clear')"
      >
        Limpiar
      </button>
    </div>

    <section v-if="categories.length" class="mt-6 border-t border-lumia-ink/8 pt-6">
      <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">Categoría</h3>
      <ul class="mt-4 space-y-3">
        <li v-for="cat in categories" :key="cat.slug" class="flex items-start gap-3">
          <input
            :id="`cat-${cat.slug}`"
            type="checkbox"
            class="mt-0.5 h-4 w-4 rounded border-lumia-ink/20 text-lumia-gold focus:ring-lumia-gold/40"
            :checked="selectedCategories.includes(cat.slug)"
            @change="toggleCategory(cat.slug)"
          >
          <label :for="`cat-${cat.slug}`" class="flex flex-1 cursor-pointer items-center justify-between gap-2 leading-snug">
            <span class="text-lumia-ink">{{ cat.name }}</span>
            <span v-if="cat.productCount != null" class="text-xs text-lumia-ink/40">{{ cat.productCount }}</span>
          </label>
        </li>
      </ul>
    </section>

    <section class="mt-6 border-t border-lumia-ink/8 pt-6">
      <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">Favoritos</h3>
      <label class="mt-4 flex cursor-pointer items-center gap-3">
        <input
          v-model="favoritesOnlyModel"
          type="checkbox"
          class="h-4 w-4 rounded border-lumia-ink/20 text-lumia-gold focus:ring-lumia-gold/40"
        >
        <span class="flex flex-1 items-center justify-between gap-2 text-lumia-ink">
          <span>Solo mis favoritos</span>
          <span v-if="favoritesCount > 0" class="text-xs text-lumia-ink/40">{{ favoritesCount }}</span>
        </span>
      </label>
      <p v-if="favoritesOnlyModel && favoritesCount === 0" class="mt-2 text-xs leading-relaxed text-lumia-ink/45">
        Aún no tienes favoritos. Toca el corazón en un producto para guardarlo.
      </p>
    </section>

    <section class="mt-6 border-t border-lumia-ink/8 pt-6">
      <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-ink/45">Ofertas</h3>
      <label class="mt-4 flex cursor-pointer items-center gap-3">
        <input
          v-model="promoOnlyModel"
          type="checkbox"
          class="h-4 w-4 rounded border-lumia-ink/20 text-lumia-gold focus:ring-lumia-gold/40"
        >
        <span class="text-lumia-ink">Solo productos en promoción</span>
      </label>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type { Category } from '#shared/types/category'

withDefaults(
  defineProps<{
    title?: string
    categories?: Category[]
    hasActiveFilters?: boolean
    favoritesCount?: number
  }>(),
  {
    title: 'Filtros',
    categories: () => [],
    hasActiveFilters: false,
    favoritesCount: 0,
  }
)

defineEmits<{ clear: [] }>()

const selectedCategories = defineModel<string[]>('selectedCategories', { default: () => [] })
const promoOnlyModel = defineModel<boolean>('promoOnly', { default: false })
const favoritesOnlyModel = defineModel<boolean>('favoritesOnly', { default: false })

function toggleCategory(slug: string) {
  const set = new Set(selectedCategories.value)
  set.has(slug) ? set.delete(slug) : set.add(slug)
  selectedCategories.value = Array.from(set)
}
</script>
