/**
 * Defensive de-duplication by event id (PRD FR-LIST-004).
 * Cursor pagination should never repeat an id, but a concurrent ingestion run
 * can shift the underlying ordering, so the first occurrence always wins and
 * backend order is otherwise preserved.
 */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const result: T[] = []

  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    result.push(item)
  }

  return result
}
