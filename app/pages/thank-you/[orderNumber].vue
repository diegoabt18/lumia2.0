<script setup lang="ts">
/**
 * Enlaces antiguos con número de orden en la URL → formato seguro.
 */
const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token.trim() : ''

if (token) {
  await navigateTo({ path: '/thank-you', query: { token } }, { replace: true })
}

const legacyOrderNumber = String(route.params.orderNumber ?? '').trim()
const isHistoryView = route.query.view === 'history'

if (isHistoryView && legacyOrderNumber && import.meta.client) {
  const { user, loaded } = useAuth()
  await new Promise<void>((resolve) => {
    if (loaded.value) {
      resolve()
      return
    }
    const stop = watch(loaded, (value) => {
      if (value) {
        stop()
        resolve()
      }
    })
  })

  if (user.value) {
    try {
      const order = await $fetch<{ id?: string }>(
        `/api/orders/by-number/${encodeURIComponent(legacyOrderNumber)}`
      )
      if (order.id) {
        await navigateTo(`/account/orders/${encodeURIComponent(order.id)}`, { replace: true })
      }
    } catch {
      /* cae al 404 */
    }
  }
}

throw createError({
  statusCode: 404,
  message: 'Este enlace ya no es válido. Revisa tu correo o entra a Mis pedidos.',
})
</script>

<template>
  <div />
</template>
