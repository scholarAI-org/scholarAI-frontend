import { ApiError } from '@/lib/api-client';

const MAX_TRANSIENT_RETRIES = 2;

export function shouldRetryDashboardQuery(failureCount: number, error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return false;
    }

    if (error.status !== undefined && error.status >= 400 && error.status < 500) {
      return false;
    }
  }

  return failureCount < MAX_TRANSIENT_RETRIES;
}
