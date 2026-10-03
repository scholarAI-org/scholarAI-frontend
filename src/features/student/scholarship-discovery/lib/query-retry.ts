import { ApiError } from '@/lib/api-client';
// 404 is final too, so a missing scholarship shows Not found without retry delays.
const NO_RETRY_STATUSES = [401, 403, 404, 422];
export const shouldRetryScholarshipQuery = (failureCount: number, error: unknown) =>
  !(error instanceof ApiError && NO_RETRY_STATUSES.includes(error.status ?? 0)) && failureCount < 2;
