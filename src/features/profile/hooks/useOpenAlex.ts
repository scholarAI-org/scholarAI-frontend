import { useQuery } from '@tanstack/react-query';
import { fetchOpenAlexSubfields, fetchOpenAlexTopics, type OpenAlexEntity } from '../api/openalex';

const STALE_TIME = 24 * 60 * 60 * 1000; // 24 hours

export function useOpenAlexSubfields() {
  return useQuery<OpenAlexEntity[]>({
    queryKey: ['openalex', 'subfields'],
    queryFn: fetchOpenAlexSubfields,
    staleTime: STALE_TIME,
  });
}

export function useOpenAlexTopics(subfieldId?: string | null) {
  return useQuery<OpenAlexEntity[]>({
    queryKey: ['openalex', 'topics', subfieldId],
    queryFn: () => fetchOpenAlexTopics(subfieldId || undefined),
    staleTime: STALE_TIME,
    enabled: !!subfieldId,
  });
}
