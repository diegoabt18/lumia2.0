export default defineNuxtPlugin(() => {
  const { ensureLoaded } = useStoreSettings()
  void ensureLoaded()
})
