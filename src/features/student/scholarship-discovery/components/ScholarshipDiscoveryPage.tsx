'use client';

import { useDiscoveryQueryState } from '../hooks/useDiscoveryQueryState';
import { DiscoveryFilters } from './DiscoveryFilters';
import { DiscoveryResultsSummary } from './DiscoveryResultsSummary';
import { DiscoveryToolbar } from './DiscoveryToolbar';

// Page content only; the student frame comes from StudentShell in the route layout.
// Below lg the filters stack above the results; the mobile dialog comes with T048.
export function ScholarshipDiscoveryPage() {
  const { query, setSearch, setSort, setFilters, clearFilters } = useDiscoveryQueryState();

  return (
    <div className="mx-auto max-w-[1156px] space-y-6">
      <DiscoveryToolbar query={query} onSearch={setSearch} onSort={setSort} />
      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <DiscoveryFilters query={query} onChange={setFilters} onClear={clearFilters} />
        <DiscoveryResultsSummary query={query} />
      </div>
    </div>
  );
}
