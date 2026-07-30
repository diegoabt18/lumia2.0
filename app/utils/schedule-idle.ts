/** Ejecuta trabajo no crítico tras el primer paint (auth, carrito, etc.). */
export function scheduleIdle(task: () => void | Promise<void>, timeoutMs = 2500): void {
  if (!import.meta.client) return
  const run = () => void task()
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: timeoutMs })
  } else {
    window.setTimeout(run, 1)
  }
}
