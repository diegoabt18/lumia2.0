<template>
  <footer class="border-t border-lumia-ink/10 bg-lumia-ink text-lumia-cream">
    <BaseContainer>
      <div class="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:py-24">
        <div class="lg:col-span-1">
          <p class="font-display text-2xl font-semibold tracking-[0.25em]">LUMIA</p>
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-lumia-cream/65">
            Velas artesanales pensadas para ritualizar los espacios cotidianos. Hechas con cera natural y
            envases que honran lo esencial.
          </p>
        </div>
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-cream/50">Comprar</h3>
          <ul class="mt-4 space-y-3 text-sm text-lumia-cream/80">
            <li><NuxtLink to="/products" class="transition-colors hover:text-lumia-cream">Catálogo</NuxtLink></li>
            <li><NuxtLink to="/#colecciones" class="transition-colors hover:text-lumia-cream">Colecciones</NuxtLink></li>
            <li><NuxtLink to="/cart" class="transition-colors hover:text-lumia-cream">Carrito</NuxtLink></li>
          </ul>
        </div>
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-cream/50">Ayuda</h3>
          <ul class="mt-4 space-y-3 text-sm text-lumia-cream/80">
            <li><NuxtLink to="/legal/envios" class="transition-colors hover:text-lumia-cream">Envíos</NuxtLink></li>
            <li><NuxtLink to="/legal/devoluciones" class="transition-colors hover:text-lumia-cream">Devoluciones</NuxtLink></li>
            <li><NuxtLink to="/auth/login" class="transition-colors hover:text-lumia-cream">Tu cuenta</NuxtLink></li>
          </ul>
        </div>
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-lumia-cream/50">Legal</h3>
          <ul class="mt-4 space-y-3 text-sm text-lumia-cream/80">
            <li><NuxtLink to="/legal/privacy" class="transition-colors hover:text-lumia-cream">Privacidad</NuxtLink></li>
            <li><NuxtLink to="/legal/terms" class="transition-colors hover:text-lumia-cream">Términos</NuxtLink></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-lumia-cream/10 py-8 text-center text-xs text-lumia-cream/45">
        © {{ year }} LUMIA · Velas y decoración ·
        <NuxtLink to="/design-system" class="underline decoration-lumia-cream/30 hover:text-lumia-cream/70">
          Sistema de diseño
        </NuxtLink>
      </div>
    </BaseContainer>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
