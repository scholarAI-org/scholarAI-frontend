import { ApiError } from '@/lib/api-client';
const NO_RETRY_STATUSES = [401, 403, 422];
export const shouldRetryScholarshipQuery = (failureCount: number, error: unknown) =>
  !(error instanceof ApiError && NO_RETRY_STATUSES.includes(error.status ?? 0)) && failureCount < 2;
