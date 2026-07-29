<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :page-key="(route) => route.fullPath" />
    </NuxtLayout>
    <ClientOnly>
      <Toaster position="top-center" rich-colors close-button :style="{ zIndex: 99999 }" />
    </ClientOnly>
  </div>
</template>
