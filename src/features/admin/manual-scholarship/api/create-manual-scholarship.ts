import { apiClient } from '@/lib/api-client';
import type { ManualScholarshipCreatePayload, ManualScholarshipCreateResponse } from '../types';

export function createManualScholarship(
  payload: ManualScholarshipCreatePayload,
  signal?: AbortSignal
): Promise<ManualScholarshipCreateResponse> {
  return apiClient<ManualScholarshipCreateResponse>('/api/scholarships/', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
}
