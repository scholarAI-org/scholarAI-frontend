'use client';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { createDiscoveryNavigator } from '../lib/discovery-navigator';
import { parseDiscoveryQuery } from '../lib/discovery-query-state';
// The URL is the only source of discovery state; search debounce belongs to the input.
export function useDiscoveryQueryState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const paramsKey = searchParams.toString();
  const query = useMemo(() => parseDiscoveryQuery(new URLSearchParams(paramsKey)), [paramsKey]);
  return useMemo(
    () => ({ query, ...createDiscoveryNavigator(router, pathname, query) }),
    [router, pathname, query]
  );
}
