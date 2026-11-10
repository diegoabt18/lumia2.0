/**
 * Selectores de opciones (Tamaño, Aroma, Color…) a partir del mapa `options` de cada variante,
 * que es lo que guarda el panel de administración (p. ej. `{ Tamaño: '200 g', Aroma: 'Lavanda' }`).
 *
 * Se usa cuando el producto no trae ejes normalizados con reglas por variante (`optionAxes` +
 * `optionRules`), que hoy la API pública no entrega. Solo hay matriz de opciones si:
 * - todas las variantes tienen un valor para cada eje, y
 * - no hay dos variantes con la misma combinación.
 * Si no se cumple, la ficha mantiene el selector de variantes.
 */

export interface VariantLike {
  sku: string
  options?: Record<string, string> | null
}

export interface OptionAxis {
  name: string
  values: string[]
}

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/** Opciones de la variante sin claves ni valores vacíos. */
export function variantOptions(variant: VariantLike): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(variant.options ?? {})) {
    const k = clean(key)
    const v = clean(value)
    if (k && v) out[k] = v
  }
  return out
}

/**
 * Ejes en el orden en que aparecen (primera variante primero) y valores en orden de aparición.
 * Devuelve [] si las opciones no permiten identificar cada variante por su combinación.
 */
export function buildOptionAxes(variants: readonly VariantLike[]): OptionAxis[] {
  if (variants.length < 2) return []
  const names: string[] = []
  const values = new Map<string, string[]>()
  const combos = new Set<string>()

  const opts = variants.map(variantOptions)
  for (const o of opts) {
    for (const [name, value] of Object.entries(o)) {
      if (!values.has(name)) {
        names.push(name)
        values.set(name, [])
      }
      const list = values.get(name)!
      if (!list.includes(value)) list.push(value)
    }
  }
  if (!names.length) return []

  for (const o of opts) {
    if (names.some((n) => !o[n])) return []
    const key = names.map((n) => o[n]).join('\u0000')
    if (combos.has(key)) return []
    combos.add(key)
  }

  // Un eje con un solo valor es igual en todas las variantes: no ayuda a elegir y se omite
  // (sigue apareciendo en la etiqueta de la variante). Con combinaciones únicas y ≥ 2 variantes,
  // al menos un eje tiene varios valores.
  return names.map((name) => ({ name, values: values.get(name)! })).filter((a) => a.values.length > 1)
}

/** Variante que coincide exactamente con la selección (un valor por eje). */
export function findVariant<T extends VariantLike>(
  variants: readonly T[],
  axes: readonly OptionAxis[],
  selection: Record<string, string>,
): T | null {
  return (
    variants.find((v) => {
      const o = variantOptions(v)
      return axes.every((a) => o[a.name] === selection[a.name])
    }) ?? null
  )
}

/**
 * Variante al elegir `value` en el eje `axis` partiendo de `current`: la combinación exacta si existe;
 * si no, la variante con ese valor que conserva más opciones de la selección actual.
 */
export function resolveVariantForChoice<T extends VariantLike>(
  variants: readonly T[],
  axes: readonly OptionAxis[],
  current: T | null,
  axis: string,
  value: string,
): T | null {
  const selection = { ...(current ? variantOptions(current) : {}), [axis]: value }
  const exact = findVariant(variants, axes, selection)
  if (exact) return exact

  let best: T | null = null
  let bestScore = -1
  for (const v of variants) {
    const o = variantOptions(v)
    if (o[axis] !== value) continue
    const score = axes.filter((a) => a.name !== axis && o[a.name] === selection[a.name]).length
    if (score > bestScore) {
      best = v
      bestScore = score
    }
  }
  return best
}
