'use client';
import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createDiscoveryNavigator } from '../lib/discovery-navigator';
import { parseDiscoveryQuery } from '../lib/discovery-query-state';
import { createHistoryRouter } from '../lib/history-router';
// The URL is the only source of discovery state; search debounce belongs to the input.
// next/navigation's pathname keeps the locale prefix (/ar/...), which the History
// API needs because it bypasses next-intl's locale-aware router.
export function useDiscoveryQueryState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useMemo(() => createHistoryRouter(), []);
  const paramsKey = searchParams.toString();
  const query = useMemo(() => parseDiscoveryQuery(new URLSearchParams(paramsKey)), [paramsKey]);
  return useMemo(
    () => ({ query, ...createDiscoveryNavigator(router, pathname, query) }),
    [router, pathname, query]
  );
}
