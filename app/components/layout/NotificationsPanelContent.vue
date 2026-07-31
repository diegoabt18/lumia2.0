<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <div class="flex shrink-0 items-center justify-between border-b border-lumia-ink/8 px-4 py-3">
      <p class="text-sm font-semibold text-lumia-ink">Notificaciones</p>
      <button
        v-if="unreadCount > 0"
        type="button"
        class="text-xs font-medium text-lumia-gold hover:underline"
        @click="emit('markAllRead')"
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
    <ul v-else class="min-h-0 flex-1 overflow-y-auto divide-y divide-lumia-ink/6">
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
            class="flex h-11 w-11 shrink-0 items-center justify-center text-lumia-ink/35 hover:text-lumia-ink/70"
            aria-label="Eliminar"
            @click="emit('remove', item.id)"
          >
            <IconX class="h-4 w-4" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { IconX } from '@tabler/icons-vue'
import type { StoreNotification } from '#shared/types/store-settings'

defineProps<{
  items: readonly StoreNotification[]
  pending: boolean
  unreadCount: number
}>()

const emit = defineEmits<{
  (e: 'markAllRead'): void
  (e: 'remove', id: string): void
}>()

const { formatStoreDate } = useUtils()
</script>
