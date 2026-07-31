<template>
  <section class="border-y border-lumia-ink/6 bg-lumia-cream/40 py-10 md:py-20">
    <BaseContainer>
      <div class="grid grid-cols-2 gap-6 sm:gap-10 lg:grid-cols-4">
        <div v-for="item in items" :key="item.title" class="text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-lumia-ink/8 bg-lumia-canvas shadow-soft sm:h-14 sm:w-14">
            <component :is="item.icon" class="h-5 w-5 stroke-[1.25] text-lumia-ink/70 sm:h-6 sm:w-6" />
          </div>
          <h3 class="mt-3 font-display text-base text-lumia-ink sm:mt-5 sm:text-xl">{{ item.title }}</h3>
          <p class="mt-1.5 text-xs leading-relaxed text-lumia-ink/60 sm:mt-2 sm:text-sm">{{ item.body }}</p>
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
