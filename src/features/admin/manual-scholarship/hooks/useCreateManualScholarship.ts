'use client';

import { useMutation } from '@tanstack/react-query';
import { createManualScholarship } from '../api/create-manual-scholarship';
import type { ManualScholarshipCreatePayload, ManualScholarshipCreateResponse } from '../types';

/**
 * Creation requests are not retried automatically: validation, authorization,
 * and conflict failures must remain available to the form for truthful feedback.
 */
export function useCreateManualScholarship() {
  return useMutation<ManualScholarshipCreateResponse, Error, ManualScholarshipCreatePayload>({
    mutationFn: (payload) => createManualScholarship(payload),
    retry: false,
  });
}
