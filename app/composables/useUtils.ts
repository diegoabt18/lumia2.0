const DEFAULT_STORE_TIMEZONE = 'America/Bogota'

export function useUtils() {
  const config = useRuntimeConfig()

  function formatPrice(amount: number, currency = 'COP') {
    const locale = config.public.storeLocale || 'es-CO'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function formatStoreDate(iso: string | undefined, preset: 'medium' | 'dayMonth' = 'medium') {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const loc = config.public.storeLocale || 'es-CO'
    const tz = config.public.storeTimezone || DEFAULT_STORE_TIMEZONE
    const opts: Intl.DateTimeFormatOptions =
      preset === 'medium'
        ? { dateStyle: 'medium', timeZone: tz }
        : { day: 'numeric', month: 'short', timeZone: tz }
    return new Intl.DateTimeFormat(loc, opts).format(d)
  }

  return { formatPrice, formatStoreDate }
}
