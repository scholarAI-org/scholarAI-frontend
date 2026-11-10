'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { currentUserQueryKey } from '@/features/auth/hooks/useCurrentUser';
import { reportScholarship } from '../api/report';
import { classifyReportError } from '../lib/report';
import type { ReportRequest } from '../schemas/report.schema';

// Sends one report. Nothing is cached: a report has no read endpoint on the
// student side, and a repeat is decided by the backend (409).
export function useReportScholarship(id: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: ReportRequest) => reportScholarship(id, body),
    onError: (error) => {
      // 401: let the existing AuthProvider re-check the session (RoleGuard redirects).
      if (classifyReportError(error) === 'unauthorized') {
        void client.invalidateQueries({ queryKey: currentUserQueryKey });
      }
    },
  });
}
