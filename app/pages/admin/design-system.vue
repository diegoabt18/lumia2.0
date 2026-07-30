<script setup lang="ts">
import {
  designSystemPalette,
  lumiaColors,
  lumiaFonts,
  lumiaLayout,
  lumiaRadii,
  lumiaShadows,
  lumiaTransitions,
} from '#shared/design-system/tokens'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({
  title: 'Sistema de diseño — Admin LUMIA',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const typography = [
  { label: 'font-display', sample: 'Velas que cuentan historias', family: 'Cormorant Garamond', usage: 'Títulos, hero, precios' },
  { label: 'font-sans', sample: 'Elaboradas a mano en pequeños lotes.', family: 'DM Sans', usage: 'Cuerpo, navegación, UI' },
]

const shadows = [
  { name: 'shadow-soft', class: 'shadow-soft', radius: 'rounded-xl' },
  { name: 'shadow-soft-lg', class: 'shadow-soft-lg', radius: 'rounded-2xl' },
]
</script>

<template>
  <BaseContainer class="py-4 sm:py-6">
    <header class="mb-14 border-b border-lumia-ink/8 pb-10">
      <p class="mb-3 text-xs uppercase tracking-[0.25em] text-lumia-gold">Referencia interna</p>
      <h1 class="font-display text-4xl font-medium text-lumia-ink sm:text-5xl">Sistema de diseño</h1>
      <p class="mt-4 max-w-2xl text-lumia-ink/70">
        Tokens visuales de Lumia 2.0. Fuente en código:
        <code class="rounded bg-lumia-beige/60 px-1.5 py-0.5 text-sm">shared/design-system/tokens.ts</code>
      </p>
    </header>

    <section class="mb-16">
      <h2 class="mb-2 font-display text-2xl text-lumia-ink">Paleta <code class="text-base">lumia</code></h2>
      <p class="mb-6 text-sm text-lumia-ink/55">Clases Tailwind: <code>bg-lumia-*</code>, <code>text-lumia-*</code></p>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <div v-for="color in designSystemPalette" :key="color.token">
          <div
            class="h-24 rounded-2xl border border-lumia-beige/60 shadow-soft"
            :style="{ backgroundColor: color.hex }"
          />
          <p class="mt-2 text-sm font-medium text-lumia-ink">{{ color.token }}</p>
          <p class="text-xs uppercase text-lumia-ink/45">{{ color.hex }}</p>
          <p class="mt-1 text-[11px] leading-snug text-lumia-ink/50">{{ color.usage }}</p>
        </div>
      </div>
    </section>

    <section class="mb-16">
      <h2 class="mb-6 font-display text-2xl text-lumia-ink">Tipografía</h2>
      <div class="space-y-6">
        <div
          v-for="t in typography"
          :key="t.label"
          class="rounded-2xl border border-lumia-ink/6 bg-white p-6 shadow-soft"
        >
          <p class="text-xs uppercase tracking-widest text-lumia-ink/40">
            {{ t.label }} — {{ t.family }}
          </p>
          <p class="mt-3 font-display text-3xl text-lumia-ink" :class="t.label === 'font-sans' ? '!font-sans text-xl' : ''">
            {{ t.sample }}
          </p>
          <p class="mt-2 text-xs text-lumia-ink/50">{{ t.usage }}</p>
        </div>
      </div>
    </section>

    <section class="mb-16">
      <h2 class="mb-6 font-display text-2xl text-lumia-ink">Botones</h2>
      <div class="flex flex-wrap gap-4 rounded-2xl border border-lumia-ink/6 bg-lumia-cream/40 p-8">
        <BaseButton variant="primary">Primary</BaseButton>
        <BaseButton variant="secondary">Secondary</BaseButton>
        <BaseButton variant="ghost">Ghost</BaseButton>
      </div>
    </section>

    <section class="mb-16">
      <h2 class="mb-6 font-display text-2xl text-lumia-ink">Sombras y radios</h2>
      <div class="grid gap-6 sm:grid-cols-3">
        <div
          v-for="s in shadows"
          :key="s.name"
          class="bg-white p-6"
          :class="[s.class, s.radius]"
        >
          <p class="font-medium text-lumia-ink">{{ s.name }}</p>
        </div>
        <div class="rounded-3xl bg-lumia-cream p-6">
          <p class="font-medium text-lumia-ink">sin sombra</p>
          <p class="text-sm text-lumia-ink/50">rounded-3xl</p>
        </div>
      </div>
    </section>

    <section>
      <h2 class="mb-6 font-display text-2xl text-lumia-ink">Tokens (referencia)</h2>
      <div class="overflow-x-auto rounded-2xl border border-lumia-ink/6 bg-lumia-ink p-6 text-sm text-lumia-cream/90">
        <pre class="whitespace-pre-wrap font-mono text-xs leading-relaxed">{{ {
          colors: lumiaColors,
          fonts: lumiaFonts,
          maxWidth: lumiaLayout.maxContent,
          shadows: lumiaShadows,
          radii: lumiaRadii,
          transitions: lumiaTransitions,
        } }}</pre>
      </div>
      <p class="mt-4 text-sm text-lumia-ink/55">
        Documentación extendida:
        <code class="rounded bg-lumia-beige/60 px-1">docs/DESIGN_SYSTEM.md</code>
      </p>
    </section>
  </BaseContainer>
</template>
