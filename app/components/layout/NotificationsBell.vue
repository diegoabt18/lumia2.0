<template>
  <div v-if="user" ref="rootRef" class="relative">
    <button
      type="button"
      class="relative flex h-10 w-10 items-center justify-center rounded-full text-lumia-ink/70 transition-colors hover:bg-lumia-beige/50 hover:text-lumia-ink"
      aria-label="Notificaciones"
      @click="toggleOpen"
    >
      <IconBell class="h-5 w-5 stroke-[1.25]" />
      <span
        v-if="unreadCount > 0"
        class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full z-50 mt-2 w-[min(92vw,22rem)] rounded-2xl border border-lumia-ink/10 bg-white shadow-soft-lg"
    >
      <div class="flex items-center justify-between border-b border-lumia-ink/8 px-4 py-3">
        <p class="text-sm font-semibold text-lumia-ink">Notificaciones</p>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="text-xs font-medium text-lumia-gold hover:underline"
          @click="markAllRead"
        >
          Marcar todas
        </button>
      </div>

      <div v-if="pending && !items.length" class="px-4 py-8 text-center text-sm text-lumia-ink/50">
        Cargando…
      </div>
      <div v-else-if="!items.length" class="px-4 py-8 text-center text-sm text-lumia-ink/50">
        No tienes notificaciones.
      </div>
      <ul v-else class="max-h-80 overflow-y-auto divide-y divide-lumia-ink/6">
        <li
          v-for="item in items"
          :key="item.id"
          class="px-4 py-3 text-sm"
          :class="item.read ? 'bg-white' : 'bg-lumia-cream/40'"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="font-medium text-lumia-ink">{{ item.title }}</p>
              <p class="mt-0.5 text-lumia-ink/65">{{ item.message }}</p>
              <p class="mt-1 text-[11px] text-lumia-ink/40">{{ formatStoreDate(item.createdAt) }}</p>
            </div>
            <button
              type="button"
              class="shrink-0 text-lumia-ink/35 hover:text-lumia-ink/70"
              aria-label="Eliminar"
              @click="remove(item.id)"
            >
              <IconX class="h-4 w-4" />
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconBell, IconX } from '@tabler/icons-vue'

const rootRef = ref<HTMLElement | null>(null)
const { user } = useAuth()
const { items, unreadCount, pending, open, markAllRead, remove, refresh } = useNotifications()
const { formatStoreDate } = useUtils()

function toggleOpen() {
  open.value = !open.value
  if (open.value) void refresh()
}

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', onDocClick)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})

function onDocClick(e: MouseEvent) {
  if (!rootRef.value?.contains(e.target as Node)) open.value = false
}
</script>
