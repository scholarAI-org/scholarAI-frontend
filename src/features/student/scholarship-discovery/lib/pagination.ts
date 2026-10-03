export type PageWindowItem =
  { type: 'page'; page: number } | { type: 'ellipsis'; key: 'start' | 'end' };

const range = (from: number, to: number): PageWindowItem[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => ({
    type: 'page' as const,
    page: from + index,
  }));

// Bounded window: first, last, the current page with `siblings` on each side,
// and ellipses for the gaps. Always 2 * siblings + 5 slots once it overflows.
export function getPageWindow(current: number, totalPages: number, siblings = 1): PageWindowItem[] {
  if (!Number.isInteger(totalPages) || totalPages < 1) return [];
  const page = Math.min(Math.max(1, Math.trunc(current) || 1), totalPages);
  const slots = siblings * 2 + 5;
  if (totalPages <= slots) return range(1, totalPages);

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, totalPages);
  const showStart = left > 2;
  const showEnd = right < totalPages - 1;
  const edge = slots - 2; // pages shown next to a single ellipsis

  if (!showStart)
    return [...range(1, edge), { type: 'ellipsis', key: 'end' }, ...range(totalPages, totalPages)];
  if (!showEnd)
    return [
      ...range(1, 1),
      { type: 'ellipsis', key: 'start' },
      ...range(totalPages - edge + 1, totalPages),
    ];
  return [
    ...range(1, 1),
    { type: 'ellipsis', key: 'start' },
    ...range(left, right),
    { type: 'ellipsis', key: 'end' },
    ...range(totalPages, totalPages),
  ];
}

// A URL page beyond the last server page (stale or shared link). Returns the
// page to reconcile to, or null when the page is valid. Zero results => page 1.
export function getOutOfRangeTarget(requestedPage: number, totalPages: number): number | null {
  const lastPage = Math.max(1, Number.isFinite(totalPages) ? Math.trunc(totalPages) : 1);
  return requestedPage > lastPage ? lastPage : null;
}

export interface OutOfRangeNotice {
  requested: number;
  page: number;
  sourceKey: string;
  targetKey: string;
}

// Keeps the "page N doesn't exist" notice while the reconciled URL is shown and
// clears it on any other navigation. Returns `current` unchanged when nothing
// changed, so it can be used for render-time state updates without looping.
export function reduceOutOfRangeNotice(
  current: OutOfRangeNotice | null,
  queryKey: string,
  detected: { requested: number; page: number; targetKey: string } | null
): OutOfRangeNotice | null {
  if (detected) {
    return current?.sourceKey === queryKey && current.page === detected.page
      ? current
      : { ...detected, sourceKey: queryKey };
  }
  if (current && (queryKey === current.targetKey || queryKey === current.sourceKey)) return current;
  return null;
}
