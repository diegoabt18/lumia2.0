<script setup lang="ts">
import type { LegalPage } from '#shared/legal/content'

defineProps<{
  page: LegalPage
}>()
</script>

<template>
  <div class="min-h-[70vh] bg-lumia-canvas px-4 py-12 md:py-16">
    <BaseContainer class="max-w-3xl">
      <AppBreadcrumbs
        :items="[
          { label: 'Inicio', to: '/' },
          { label: page.title },
        ]"
      />

      <div class="mt-8 rounded-2xl border border-lumia-ink/10 bg-white p-5 shadow-soft sm:p-8">
        <h1 class="font-display text-3xl font-medium text-lumia-ink">{{ page.title }}</h1>
        <p class="mt-2 text-sm text-lumia-ink/60">{{ page.subtitle }}</p>

        <div class="mt-8 space-y-6 text-sm leading-relaxed text-lumia-ink/70">
          <section v-for="section in page.sections" :key="section.title">
            <h2 class="font-display text-lg font-medium text-lumia-ink">{{ section.title }}</h2>
            <p v-for="(p, i) in section.paragraphs" :key="`${section.title}-p-${i}`" class="mt-2">{{ p }}</p>
            <ul v-if="section.bullets?.length" class="mt-2 list-inside list-disc space-y-1">
              <li v-for="b in section.bullets" :key="b">{{ b }}</li>
            </ul>
            <ol v-if="section.ordered?.length" class="mt-2 list-inside list-decimal space-y-1">
              <li v-for="o in section.ordered" :key="o">{{ o }}</li>
            </ol>
          </section>
          <p v-if="page.updatedAt" class="text-xs text-lumia-ink/50">Última actualización: {{ page.updatedAt }}</p>
        </div>
      </div>
    </BaseContainer>
  </div>
</template>
