'use client';
import { useQuery } from '@tanstack/react-query';
import { scholarshipDetailQueryOptions } from '../lib/queries';
export const useScholarshipDetail = (id: number) => useQuery(scholarshipDetailQueryOptions(id));
