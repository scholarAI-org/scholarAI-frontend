'use client';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  discoveryUpdates,
  parseDiscoveryQuery,
  planDiscoveryNavigation,
  type DiscoveryNavigationMode,
} from '../lib/discovery-query-state';
import type { DiscoveryFilterPatch, DiscoveryQuery, DiscoverySort } from '../types';
// The URL is the only source of discovery state; search debounce belongs to the input.
export function useDiscoveryQueryState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const paramsKey = searchParams.toString();
  const query = useMemo(() => parseDiscoveryQuery(new URLSearchParams(paramsKey)), [paramsKey]);
  const navigate = useCallback(
    (next: DiscoveryQuery, mode: DiscoveryNavigationMode) => {
      const plan = planDiscoveryNavigation(pathname, query, next, mode);
      if (!plan) return;
      if (plan.mode === 'push') router.push(plan.href, { scroll: false });
      else router.replace(plan.href, { scroll: false });
    },
    [pathname, query, router]
  );
  const { setSearch, setFilters, setSort, setPage } = discoveryUpdates;
  return {
    query,
    setSearch: (search: string) => navigate(setSearch.update(query, search), setSearch.mode),
    setFilters: (patch: DiscoveryFilterPatch) =>
      navigate(setFilters.update(query, patch), setFilters.mode),
    setSort: (sort: DiscoverySort) => navigate(setSort.update(query, sort), setSort.mode),
    setPage: (page: number) => navigate(setPage.update(query, page), setPage.mode),
  };
}
