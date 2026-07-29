<template>
  <LegalPageContent v-if="page" :page="page" />
  <BaseContainer v-else class="py-16 text-center">
    <h1 class="font-display text-2xl text-lumia-ink">Página no encontrada</h1>
    <p class="mt-4 text-lumia-ink/60">No existe contenido legal para esta ruta.</p>
    <BaseButton to="/" variant="secondary" class="mt-8">Volver al inicio</BaseButton>
  </BaseContainer>
</template>

<script setup lang="ts">
import { getLegalPage } from '#shared/legal/content'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const page = computed(() => getLegalPage(slug.value))

useHead(() => ({
  title: page.value ? `${page.value.title} — LUMIA` : 'Legal — LUMIA',
  meta: [{ name: 'robots', content: 'index, follow' }],
}))
</script>
