'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import { getScholarship, getScholarshipFilterOptions, getScholarships } from '../api/scholarships';
import { studentScholarshipKeys } from '../query-keys';
import type { DiscoveryQuery } from '../types';
const retry = (count: number, error: unknown) =>
  !(error instanceof ApiError && [401, 403, 422].includes(error.status || 0)) && count < 2;
export const useScholarshipDiscovery = (query: DiscoveryQuery) =>
  useQuery({
    queryKey: studentScholarshipKeys.discovery(query),
    queryFn: ({ signal }) => getScholarships(query, signal),
    placeholderData: keepPreviousData,
    retry,
  });
export const useScholarshipFilterOptions = () =>
  useQuery({
    queryKey: studentScholarshipKeys.filterOptions(),
    queryFn: ({ signal }) => getScholarshipFilterOptions(signal),
    staleTime: 1000 * 60 * 30,
    retry,
  });
export const useScholarshipDetail = (id: number) =>
  useQuery({
    queryKey: studentScholarshipKeys.detail(id),
    queryFn: ({ signal }) => getScholarship(id, signal),
    enabled: Number.isInteger(id) && id > 0,
    retry,
  });
