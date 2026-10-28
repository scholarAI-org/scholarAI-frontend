'use client';

import { useQuery } from '@tanstack/react-query';
import type { StartedMap } from '../lib/start-state';
import { trackingKeys } from '../query-keys';

// Subscribes to the optimistic overlay kept in the query cache by startMutationOptions.
// It has no fetcher: the cache is only ever written by the start mutation.
const EMPTY: StartedMap = {};

export function useStartedMap(): StartedMap {
  const { data } = useQuery<StartedMap>({
    queryKey: trackingKeys.started(),
    queryFn: () => EMPTY,
    initialData: EMPTY,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data;
}
