<script setup lang="ts">
const Toaster = defineAsyncComponent(async () => {
  await import('vue-sonner/style.css')
  const mod = await import('vue-sonner')
  return mod.Toaster
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <Toaster position="top-center" rich-colors close-button :style="{ zIndex: 99999 }" />
    </ClientOnly>
  </div>
</template>
