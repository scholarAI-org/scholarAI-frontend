'use client';

import type { DiscoveryQuery, DiscoverySort } from '../types';
import { DiscoverySearchField } from './DiscoverySearchField';
import { DiscoverySortSelect } from './DiscoverySortSelect';

interface DiscoveryToolbarProps {
  query: DiscoveryQuery;
  onSearch: (search: string) => void;
  onSort: (sort: DiscoverySort) => void;
}

export function DiscoveryToolbar({ query, onSearch, onSort }: DiscoveryToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_4px_12px_rgba(2,38,71,0.04)] sm:flex-row sm:items-center sm:p-5">
      <DiscoverySearchField value={query.search} onCommit={onSearch} />
      <DiscoverySortSelect value={query.sort} onChange={onSort} />
    </div>
  );
}
