'use client';

import { useState } from 'react';
import { useDiscoveryQueryState } from '../hooks/useDiscoveryQueryState';
import { CountryFilter } from './CountryFilter';
import { DiscoveryFilters } from './DiscoveryFilters';
import { DiscoveryResultsSummary } from './DiscoveryResultsSummary';
import { DiscoveryToolbar } from './DiscoveryToolbar';
import { DiscoveryViewToggle } from './DiscoveryViewToggle';
import type { DiscoveryView } from '../types';

// Page content only; the student frame comes from StudentShell in the route layout.
// Figma 2262:3331: toolbar and results share the main column; the 212px filter
// panel sits on the inline-end side. Below lg everything stacks (T048 adds the
// mobile filters dialog). DOM order (toolbar, filters, results) is the tab order.
export function ScholarshipDiscoveryPage() {
  const { query, setSearch, setSort, setFilters, clearFilters } = useDiscoveryQueryState();
  // In-memory presentation state: not in the URL, query keys or storage.
  const [view, setView] = useState<DiscoveryView>('grid');

  return (
    <div className="mx-auto grid max-w-[1156px] items-start gap-x-6 gap-y-5 lg:grid-cols-[minmax(0,1fr)_212px]">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <DiscoveryToolbar
          query={query}
          onSearch={setSearch}
          onSort={setSort}
          viewToggle={<DiscoveryViewToggle value={view} onChange={setView} />}
        />
      </div>
      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
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
        <DiscoveryResultsSummary query={query} />
      </div>
    </div>
  );
}
