export function groupValueIdsByOption(
  valueIds: string[],
  valueIdToOptionId: Map<string, string>
): Array<{ optionId: string; allowedValueIds: string[] }> {
  const by = new Map<string, string[]>()
  for (const vid of valueIds) {
    const oid = valueIdToOptionId.get(vid)
    if (!oid) continue
    if (!by.has(oid)) by.set(oid, [])
    const arr = by.get(oid)!
    if (!arr.includes(vid)) arr.push(vid)
  }
  return [...by.entries()].map(([optionId, allowedValueIds]) => ({ optionId, allowedValueIds }))
}
