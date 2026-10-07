'use client';
import { useQuery } from '@tanstack/react-query';
import { discoveryQueryOptions } from '../lib/queries';
import type { DiscoveryQuery } from '../types';
export const useScholarshipDiscovery = (query: DiscoveryQuery) =>
  useQuery(discoveryQueryOptions(query));
