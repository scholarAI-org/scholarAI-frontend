'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { HomeSectionId } from '../config/home-sections';
import { sourceQueryOptions } from '../lib/source-query';
import { createHomeSources } from '../sources/create-home-sources';
import type { HomeSource } from '../sources/types';

// `mockSections` comes from the server (resolveHomeMockSections); a production build
// ignores it. Memoized by value because the array identity changes between renders.
export function useHomeSources(mockSections: readonly HomeSectionId[]) {
  const key = mockSections.join(',');
  return useMemo(
    () => createHomeSources({ mockSections: key ? (key.split(',') as HomeSectionId[]) : [] }),
    [key]
  );
}

export const useHomeSourceQuery = <T>(section: HomeSectionId, source: HomeSource<T>) =>
  useQuery(sourceQueryOptions(section, source));
