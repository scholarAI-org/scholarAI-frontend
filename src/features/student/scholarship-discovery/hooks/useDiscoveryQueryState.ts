'use client';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createDiscoveryNavigator, type DiscoveryRouter } from '../lib/discovery-navigator';
import { parseDiscoveryQuery } from '../lib/discovery-query-state';
import { createHistoryRouter } from '../lib/history-router';
import {
  pendingFromHref,
  resolveDiscoveryQuery,
  searchKeyOf,
  type PendingDiscoveryQuery,
} from '../lib/pending-query';
// The URL is the source of discovery state; search debounce belongs to the input.
// A navigation's own target is shown until useSearchParams catches up with it
// (see lib/pending-query.ts).
// next/navigation's pathname keeps the locale prefix (/ar/...), which the History
// API needs because it bypasses next-intl's locale-aware router.
export function useDiscoveryQueryState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [pending, setPending] = useState<PendingDiscoveryQuery | null>(null);
  const paramsKey = searchParams.toString();

  // The URL has caught up: drop the pending copy so later URL changes are not masked.
  if (pending && pending.targetKey === searchKeyOf(`?${paramsKey}`)) setPending(null);

  // Back/Forward moves the URL somewhere the pending query never pointed to.
  useEffect(() => {
    const clear = () => setPending(null);
    window.addEventListener('popstate', clear);
    return () => window.removeEventListener('popstate', clear);
  }, []);

  const router = useMemo<DiscoveryRouter>(() => {
    const history = createHistoryRouter();
    return {
      push: (href, options) => {
        history.push(href, options);
        setPending(pendingFromHref(href));
      },
      replace: (href, options) => {
        history.replace(href, options);
        setPending(pendingFromHref(href));
      },
    };
  }, []);
  const urlQuery = useMemo(() => parseDiscoveryQuery(new URLSearchParams(paramsKey)), [paramsKey]);
  const query = resolveDiscoveryQuery(paramsKey, urlQuery, pending);
  return useMemo(
    () => ({ query, ...createDiscoveryNavigator(router, pathname, query) }),
    [router, pathname, query]
  );
}
