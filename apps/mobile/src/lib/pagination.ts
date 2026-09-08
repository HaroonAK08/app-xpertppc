export function flattenUniquePages<T extends { id: string }>(
  pages: ReadonlyArray<{ data: ReadonlyArray<T> }> | undefined,
): T[] {
  if (!pages?.length) return [];
  const seen = new Set<string>();
  const items: T[] = [];
  for (const page of pages) {
    for (const item of page.data) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  return items;
}
