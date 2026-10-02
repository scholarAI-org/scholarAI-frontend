'use client';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  buildDiscoveryHref,
  parseDiscoveryQuery,
  withFilterChange,
  withPage,
  withSearch,
  withSort,
} from '../lib/discovery-query-state';
import type { DiscoveryFilterPatch, DiscoveryQuery, DiscoverySort } from '../types';
// The URL is the only source of discovery state; search debounce belongs to the input.
export function useDiscoveryQueryState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const paramsKey = searchParams.toString();
  const query = useMemo(() => parseDiscoveryQuery(new URLSearchParams(paramsKey)), [paramsKey]);
  const replaceQuery = useCallback(
    (next: DiscoveryQuery) => {
      const href = buildDiscoveryHref(pathname, next);
      if (href !== buildDiscoveryHref(pathname, query)) router.replace(href, { scroll: false });
    },
    [pathname, query, router]
  );
  return {
    query,
    setSearch: (search: string) => replaceQuery(withSearch(query, search)),
    setFilters: (patch: DiscoveryFilterPatch) => replaceQuery(withFilterChange(query, patch)),
    setSort: (sort: DiscoverySort) => replaceQuery(withSort(query, sort)),
    setPage: (page: number) => replaceQuery(withPage(query, page)),
  };
}
