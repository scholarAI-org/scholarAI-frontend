'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HOME_API_AVAILABILITY, type HomeSectionId } from '../config/home-sections';
import { sourceQueryOptions } from '../lib/source-query';
import { createHomeSources } from '../sources/create-home-sources';
import type { HomeSource } from '../sources/types';

interface HomeSourceOptions {
  // Feature 011: the server-only notifications flag, passed down as a prop. When true the
  // notifications source is the real one (GET /api/notifications/unread-count). The static
  // HOME_API_AVAILABILITY table is not edited; this only overrides it per request.
  notificationsEnabled?: boolean;
}

// `mockSections` comes from the server (resolveHomeMockSections); a production build
// ignores it. Memoized by value because the array identity changes between renders.
export function useHomeSources(
  mockSections: readonly HomeSectionId[],
  { notificationsEnabled = false }: HomeSourceOptions = {}
) {
  const key = mockSections.join(',');
  return useMemo(
    () =>
      createHomeSources({
        mockSections: key ? (key.split(',') as HomeSectionId[]) : [],
        availability: notificationsEnabled
          ? { ...HOME_API_AVAILABILITY, notifications: true }
          : HOME_API_AVAILABILITY,
      }),
    [key, notificationsEnabled]
  );
}

export const useHomeSourceQuery = <T>(section: HomeSectionId, source: HomeSource<T>) =>
  useQuery(sourceQueryOptions(section, source));
