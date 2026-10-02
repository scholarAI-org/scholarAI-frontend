'use client';

import { useDiscoveryQueryState } from '../hooks/useDiscoveryQueryState';
import { DiscoveryResultsSummary } from './DiscoveryResultsSummary';
import { DiscoveryToolbar } from './DiscoveryToolbar';

// Page content only; the student frame comes from StudentShell in the route layout.
export function ScholarshipDiscoveryPage() {
  const { query, setSearch, setSort } = useDiscoveryQueryState();

  return (
    <div className="mx-auto max-w-[1156px] space-y-6">
      <DiscoveryToolbar query={query} onSearch={setSearch} onSort={setSort} />
      <DiscoveryResultsSummary query={query} />
    </div>
  );
}
