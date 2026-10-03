import { discoveryUpdates, planDiscoveryNavigation } from './discovery-query-state';
import type { DiscoveryFilterPatch, DiscoveryQuery, DiscoverySort } from '../types';

export interface DiscoveryRouter {
  push(href: string, options?: { scroll?: boolean }): void;
  replace(href: string, options?: { scroll?: boolean }): void;
}

// Router wiring for useDiscoveryQueryState, kept free of React so it can be tested.
export function createDiscoveryNavigator(
  router: DiscoveryRouter,
  pathname: string,
  query: DiscoveryQuery
) {
  const navigate = (next: DiscoveryQuery, mode: 'push' | 'replace') => {
    const plan = planDiscoveryNavigation(pathname, query, next, mode);
    if (!plan) return null;
    if (plan.mode === 'push') router.push(plan.href, { scroll: false });
    else router.replace(plan.href, { scroll: false });
    return plan;
  };
  const { setSearch, setFilters, setSort, setPage, clearFilters, reconcilePage } = discoveryUpdates;
  return {
    setSearch: (search: string) => navigate(setSearch.update(query, search), setSearch.mode),
    setFilters: (patch: DiscoveryFilterPatch) =>
      navigate(setFilters.update(query, patch), setFilters.mode),
    setSort: (sort: DiscoverySort) => navigate(setSort.update(query, sort), setSort.mode),
    setPage: (page: number) => navigate(setPage.update(query, page), setPage.mode),
    clearFilters: () => navigate(clearFilters.update(query), clearFilters.mode),
    reconcilePage: (page: number) =>
      navigate(reconcilePage.update(query, page), reconcilePage.mode),
  };
}
