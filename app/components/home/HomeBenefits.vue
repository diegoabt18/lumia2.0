<template>
  <section class="border-y border-lumia-ink/6 bg-lumia-cream/40 py-16 md:py-20">
    <BaseContainer>
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="item in items" :key="item.title" class="text-center">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-lumia-ink/8 bg-lumia-canvas shadow-soft">
            <component :is="item.icon" class="h-6 w-6 stroke-[1.25] text-lumia-ink/70" />
          </div>
          <h3 class="mt-5 font-display text-xl text-lumia-ink">{{ item.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-lumia-ink/60">{{ item.body }}</p>
        </div>
      </div>
    </BaseContainer>
  </section>
</template>

<script setup lang="ts">
import { IconFlame, IconLeaf, IconShieldLock, IconTruck } from '@tabler/icons-vue'

const items = [
  { title: 'Hecho a mano', body: 'Piezas elaboradas en pequeños lotes con atención al detalle.', icon: IconFlame },
  { title: 'Materiales conscientes', body: 'Ceras y envases seleccionados para un hogar más sereno.', icon: IconLeaf },
  { title: 'Pago seguro', body: 'Transacciones cifradas y métodos de confianza.', icon: IconShieldLock },
  { title: 'Envío rápido', body: 'Preparamos tu pedido con cuidado y lo despachamos sin demora.', icon: IconTruck },
]
</script>
