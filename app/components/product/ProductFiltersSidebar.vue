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
        <li v-for="cat in categories" :key="cat.slug">
          <label
            :for="`cat-${cat.slug}`"
            class="flex cursor-pointer items-start gap-3"
            @click.prevent="toggleCategory(cat.slug)"
          >
            <input
              :id="`cat-${cat.slug}`"
              type="radio"
              name="category-filter"
              class="mt-0.5 h-4 w-4 border-lumia-ink/20 text-lumia-gold focus:ring-lumia-gold/40"
              :checked="selectedCategory === cat.slug"
              tabindex="-1"
            >
            <span class="flex flex-1 items-center justify-between gap-2 leading-snug">
              <span class="text-lumia-ink">{{ cat.name }}</span>
              <span v-if="cat.productCount != null" class="text-xs text-lumia-ink/40">{{ cat.productCount }}</span>
            </span>
          </label>
          <ul
            v-if="selectedCategory === cat.slug && subcategories.length"
            class="ml-7 mt-3 space-y-2 border-l border-lumia-ink/10 pl-4"
          >
            <li v-for="sub in subcategories" :key="sub.slug">
              <label
                :for="`sub-${sub.slug}`"
                class="flex cursor-pointer items-center gap-2 text-[13px]"
                @click.prevent="toggleSubcategory(sub.slug)"
              >
                <input
                  :id="`sub-${sub.slug}`"
                  type="radio"
                  name="subcategory-filter"
                  class="h-3.5 w-3.5 border-lumia-ink/20 text-lumia-gold focus:ring-lumia-gold/40"
                  :checked="selectedSubcategory === sub.slug"
                  tabindex="-1"
                >
                <span class="flex flex-1 items-center justify-between gap-2 leading-snug">
                  <span class="text-lumia-ink/85">{{ sub.name }}</span>
                  <span class="text-xs text-lumia-ink/40">{{ sub.productCount }}</span>
                </span>
              </label>
            </li>
          </ul>
        </li>
      </ul>
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
    /** Subcategorías de la categoría seleccionada (se muestran bajo ella). */
    subcategories?: Array<{ name: string; slug: string; productCount: number }>
    hasActiveFilters?: boolean
  }>(),
  {
    title: 'Filtros',
    categories: () => [],
    subcategories: () => [],
    hasActiveFilters: false,
  }
)

defineEmits<{ clear: [] }>()

const selectedCategory = defineModel<string>('selectedCategory', { default: '' })
const selectedSubcategory = defineModel<string>('selectedSubcategory', { default: '' })
const promoOnlyModel = defineModel<boolean>('promoOnly', { default: false })

function toggleCategory(slug: string) {
  selectedCategory.value = selectedCategory.value === slug ? '' : slug
}

function toggleSubcategory(slug: string) {
  selectedSubcategory.value = selectedSubcategory.value === slug ? '' : slug
}
</script>
