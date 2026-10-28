import { apiClient } from '@/lib/api-client';
import { parseReportResponse } from '../lib/report';
import type { ReportRequest } from '../schemas/report.schema';

// POST /api/scholarships/{id}/reports. Resolves for any 2xx; HTTP errors reject
// with an ApiError that keeps its status (see classifyReportError).
export async function reportScholarship(id: number, body: ReportRequest): Promise<{ id?: number }> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new RangeError('invalid scholarship id');
  const raw = await apiClient<unknown>(`/api/scholarships/${id}/reports`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseReportResponse(raw);
}
