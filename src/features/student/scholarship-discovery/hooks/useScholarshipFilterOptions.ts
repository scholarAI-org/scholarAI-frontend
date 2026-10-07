'use client';
import { useQuery } from '@tanstack/react-query';
import { filterOptionsQueryOptions } from '../lib/queries';
export { FILTER_OPTIONS_STALE_TIME } from '../lib/queries';
export const useScholarshipFilterOptions = () => useQuery(filterOptionsQueryOptions());
