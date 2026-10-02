'use client';

import { useDiscoveryQueryState } from '../hooks/useDiscoveryQueryState';
import { DiscoveryResultsSummary } from './DiscoveryResultsSummary';

// Page content only; the student frame comes from StudentShell in the route layout.
export function ScholarshipDiscoveryPage() {
  const { query } = useDiscoveryQueryState();

  return (
    <div className="mx-auto max-w-[1156px] space-y-6">
      <DiscoveryResultsSummary query={query} />
    </div>
  );
}
