'use client';

import { useEffect, useState } from 'react';
import { useDiscoveryQueryState } from '../hooks/useDiscoveryQueryState';
import { rememberDiscoverySearch } from '../lib/discovery-return';
import { CountryFilter } from './CountryFilter';
import { DiscoveryFilters } from './DiscoveryFilters';
import { DiscoveryFiltersDialog } from './DiscoveryFiltersDialog';
import { DiscoveryQuickChips } from './DiscoveryQuickChips';
import { DiscoveryToolbar } from './DiscoveryToolbar';
import { DiscoveryViewToggle } from './DiscoveryViewToggle';
import { ScholarshipResults } from './ScholarshipResults';
import type { DiscoveryView } from '../types';

// Page content only; the student frame comes from StudentShell in the route layout.
// Figma 2262:3331: toolbar and results share the main column; the 212px filter
// panel sits on the inline-end side. Below lg the panel is replaced by quick chips
// and the filters dialog (T048); cards use one column below 640px and two above.
// DOM order (toolbar, filters, results) is the tab order.
export function ScholarshipDiscoveryPage({ detailsEnabled = false }: { detailsEnabled?: boolean }) {
  const { query, setSearch, setSort, setFilters, setPage, clearFilters, reconcilePage } =
    useDiscoveryQueryState();
  // In-memory presentation state: not in the URL, query keys or storage.
  const [view, setView] = useState<DiscoveryView>('grid');

  // The details page's Back link returns to exactly this URL (memory only).
  useEffect(() => {
    rememberDiscoverySearch(window.location.search);
  }, [query]);

  return (
    <div className="mx-auto grid max-w-[1156px] items-start gap-x-6 gap-y-5 lg:grid-cols-[minmax(0,1fr)_212px]">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <DiscoveryToolbar
          query={query}
          onSearch={setSearch}
          onSort={setSort}
          viewToggle={<DiscoveryViewToggle value={view} onChange={setView} />}
          filtersButton={<DiscoveryFiltersDialog query={query} onApply={setFilters} />}
        />
        <div className="mt-3 lg:hidden">
          <DiscoveryQuickChips query={query} onChange={setFilters} />
        </div>
      </div>
      <div className="hidden lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:block">
        <DiscoveryFilters
          query={query}
          onChange={setFilters}
          onClear={clearFilters}
          countryFilter={
            <CountryFilter
              selected={query.countries}
              onChange={(countries) => setFilters({ countries })}
            />
          }
        />
      </div>
      <div className="min-w-0 lg:col-start-1 lg:row-start-2">
        <ScholarshipResults
          query={query}
          view={view}
          onPageChange={setPage}
          onReconcilePage={reconcilePage}
          onClearFilters={clearFilters}
          detailsEnabled={detailsEnabled}
        />
      </div>
    </div>
  );
}
