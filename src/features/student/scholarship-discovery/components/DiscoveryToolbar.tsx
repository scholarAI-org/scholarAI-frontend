'use client';

import type { ReactNode } from 'react';
import type { DiscoveryQuery, DiscoverySort } from '../types';
import { DiscoverySearchField } from './DiscoverySearchField';
import { DiscoverySortSelect } from './DiscoverySortSelect';

interface DiscoveryToolbarProps {
  query: DiscoveryQuery;
  onSearch: (search: string) => void;
  onSort: (sort: DiscoverySort) => void;
  viewToggle?: ReactNode;
  // Below lg: the mobile filters trigger (T048).
  filtersButton?: ReactNode;
}

// Figma toolbar (2287:3434): search, sort and view toggle on the page background.
export function DiscoveryToolbar({
  query,
  onSearch,
  onSort,
  viewToggle,
  filtersButton,
}: DiscoveryToolbarProps) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <DiscoverySearchField value={query.search} onCommit={onSearch} />
      <div className="flex flex-wrap items-center gap-2">
        <DiscoverySortSelect value={query.sort} onChange={onSort} />
        {filtersButton}
        {viewToggle}
      </div>
    </div>
  );
}
