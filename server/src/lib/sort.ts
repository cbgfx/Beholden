export type SortableLike = { sort?: number; updatedAt?: number };

export function nextSort(items: Array<SortableLike | null | undefined>): number {
  return (
    items.reduce((m: number, x: SortableLike | null | undefined) => {
      return Math.max(m, Number.isFinite(x?.sort) ? (x!.sort as number) : 0);
    }, 0) + 1
  );
}

export function bySortThenUpdatedDesc(a: any, b: any): number {
  const as = Number.isFinite(a?.sort) ? a.sort : 1e9;
  const bs = Number.isFinite(b?.sort) ? b.sort : 1e9;
  if (as !== bs) return as - bs;
  return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
}
