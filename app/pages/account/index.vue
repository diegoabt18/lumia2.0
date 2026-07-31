<template>
  <BaseContainer class="py-16">
    <h1 class="font-display text-3xl text-lumia-ink">Mi cuenta</h1>

    <div v-if="user" class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section class="rounded-2xl border border-lumia-ink/8 bg-white/70 p-6 shadow-soft">
        <h2 class="font-display text-xl text-lumia-ink">Perfil</h2>
        <form class="mt-6 space-y-4" @submit.prevent="saveProfile">
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="name">Nombre</label>
            <input id="name" v-model="profileForm.name" type="text" class="lumia-field-input" required />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-lumia-ink/45" for="nickname">Apodo</label>
            <input id="nickname" v-model="profileForm.nickname" type="text" class="lumia-field-input" />
          </div>
          <p class="text-sm text-lumia-ink/55">Email: {{ user.email }}</p>
          <BaseButton type="submit" :disabled="profileSaving">{{ profileSaving ? 'Guardando…' : 'Guardar perfil' }}</BaseButton>
        </form>
      </section>

      <aside class="space-y-4">
        <div class="rounded-2xl border border-lumia-ink/8 bg-white/70 p-6 shadow-soft">
          <h2 class="font-display text-lg text-lumia-ink">Accesos rápidos</h2>
          <div class="mt-4 flex flex-col gap-2">
            <BaseButton to="/account/orders" variant="secondary">Mis pedidos</BaseButton>
            <BaseButton to="/account/favorites" variant="secondary">Favoritos</BaseButton>
          </div>
        </div>

        <div class="rounded-2xl border border-lumia-ink/8 bg-white/70 p-6 shadow-soft">
          <h2 class="font-display text-lg text-lumia-ink">Notificaciones</h2>
          <div class="mt-4 space-y-3 text-sm">
            <label class="flex items-center gap-2">
              <input v-model="prefs.promotions" type="checkbox" class="rounded border-lumia-ink/20" />
              Promociones
            </label>
            <label class="flex items-center gap-2">
              <input v-model="prefs.orderStatus" type="checkbox" class="rounded border-lumia-ink/20" />
              Estado de pedidos
            </label>
            <label class="flex items-center gap-2">
              <input v-model="prefs.newProducts" type="checkbox" class="rounded border-lumia-ink/20" />
              Nuevos productos
            </label>
          </div>
          <BaseButton type="button" variant="ghost" class="mt-4" :disabled="prefsSaving" @click="savePreferences">
            {{ prefsSaving ? 'Guardando…' : 'Guardar preferencias' }}
          </BaseButton>
        </div>

        <BaseButton type="button" variant="ghost" @click="logout">Cerrar sesión</BaseButton>
        <BaseButton type="button" variant="ghost" class="text-rose-600" @click="logoutAll">Cerrar sesión en todos los dispositivos</BaseButton>
      </aside>
    </div>

    <div v-else class="mt-8">
      <p class="text-lumia-ink/60">Inicia sesión para ver tu cuenta.</p>
      <BaseButton to="/auth/login" variant="primary" class="mt-6">Entrar</BaseButton>
    </div>
  </BaseContainer>
</template>

<script setup lang="ts">
import type { NotificationPreferences } from '#shared/types/store-settings'

const { user, logout, fetchUser } = useAuth()
const toast = useToast()

const profileForm = reactive({ name: '', nickname: '' })
const profileSaving = ref(false)
const prefsSaving = ref(false)
const prefs = reactive<NotificationPreferences>({
  promotions: true,
  orderStatus: true,
  newProducts: false,
})

watch(
  user,
  (u) => {
    profileForm.name = u?.name ?? ''
    profileForm.nickname = u?.nickname ?? ''
    if (u?.notificationPreferences) {
      prefs.promotions = u.notificationPreferences.promotions ?? true
      prefs.orderStatus = u.notificationPreferences.orderStatus ?? true
      prefs.newProducts = u.notificationPreferences.newProducts ?? false
    }
  },
  { immediate: true }
)

async function saveProfile() {
  profileSaving.value = true
  try {
    await $fetch('/api/auth/profile', {
      method: 'PATCH',
      body: {
        name: profileForm.name.trim(),
        nickname: profileForm.nickname.trim() || undefined,
      },
    })
    await fetchUser({ force: true })
    toast.success('Perfil actualizado')
  } catch {
    toast.error('No se pudo guardar el perfil')
  } finally {
    profileSaving.value = false
  }
}

async function savePreferences() {
  prefsSaving.value = true
  try {
    await $fetch('/api/account/preferences', {
      method: 'PATCH',
      body: { notificationPreferences: { ...prefs } },
    })
    toast.success('Preferencias guardadas')
  } catch {
    toast.error('No se pudieron guardar las preferencias')
  } finally {
    prefsSaving.value = false
  }
}

async function logoutAll() {
  try {
    await $fetch('/api/auth/logout-all', { method: 'POST', body: {} })
    await logout()
  } catch {
    toast.error('No se pudo cerrar todas las sesiones')
  }
}

useHead({ title: 'Mi cuenta — LUMIA' })
</script>
