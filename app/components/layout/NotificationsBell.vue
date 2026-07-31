<template>
  <div v-if="user" ref="rootRef" class="relative">
    <button
      type="button"
      class="relative flex h-11 w-11 items-center justify-center rounded-full text-lumia-ink/70 transition-colors hover:bg-lumia-beige/50 hover:text-lumia-ink"
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

    <!-- Móvil: bottom sheet -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200" leave-active-class="transition duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
        <div v-if="open" class="fixed inset-0 z-[70] bg-lumia-ink/40 md:hidden" @click="open = false" />
      </Transition>
      <Transition enter-active-class="transition duration-250 ease-out" leave-active-class="transition duration-200 ease-in" enter-from-class="translate-y-full" leave-to-class="translate-y-full">
        <aside
          v-if="open"
          class="fixed inset-x-0 bottom-0 z-[71] flex max-h-[min(75vh,520px)] flex-col overflow-hidden rounded-t-3xl border border-lumia-ink/10 bg-white pb-[env(safe-area-inset-bottom)] shadow-soft-lg md:hidden"
          @click.stop
        >
          <div class="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-lumia-ink/15" aria-hidden="true" />
          <NotificationsPanelContent
            :items="items"
            :pending="pending"
            :unread-count="unreadCount"
            @mark-all-read="markAllRead"
            @remove="remove"
          />
        </aside>
      </Transition>
    </Teleport>

    <!-- Desktop: dropdown -->
    <div
      v-if="open"
      class="absolute right-0 top-full z-50 mt-2 hidden w-[min(92vw,22rem)] rounded-2xl border border-lumia-ink/10 bg-white shadow-soft-lg md:block"
    >
      <NotificationsPanelContent
        :items="items"
        :pending="pending"
        :unread-count="unreadCount"
        @mark-all-read="markAllRead"
        @remove="remove"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconBell } from '@tabler/icons-vue'

const rootRef = ref<HTMLElement | null>(null)
const { user } = useAuth()
const { items, unreadCount, pending, open, markAllRead, remove, refresh } = useNotifications()

function toggleOpen() {
  open.value = !open.value
  if (open.value) void refresh()
}

onMounted(() => {
  if (import.meta.client) document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})

function onDocClick(e: MouseEvent) {
  if (!rootRef.value?.contains(e.target as Node)) open.value = false
}
</script>
