import { shouldRetryScholarshipQuery } from '@/features/student/scholarship-discovery/lib/query-retry';
import type { HomeSectionId } from '../config/home-sections';
import { studentHomeKeys } from '../query-keys';
import type { HomeSource } from '../sources/types';

// Query options for a section that reads through a HomeSource. The key ends with the
// source kind, so demo data can never be served from cache once the real API is used,
// and an unavailable source never runs.
export function sourceQueryOptions<T>(section: HomeSectionId, source: HomeSource<T>) {
  return {
    queryKey: studentHomeKeys.source(section, source.kind),
    enabled: source.kind !== 'unavailable',
    queryFn: ({ signal }: { signal?: AbortSignal }): Promise<T> =>
      source.kind === 'unavailable'
        ? Promise.reject(new Error(`Home source "${section}" is unavailable`))
        : source.load(signal),
    retry: shouldRetryScholarshipQuery,
  };
}
