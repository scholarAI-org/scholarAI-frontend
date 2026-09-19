import { ApiError } from '@/lib/api-client';

export function shouldRetryScholarshipReviewQuery(failureCount: number, error: unknown) {
  if (
    error instanceof ApiError &&
    error.status !== undefined &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return false;
  }
  return failureCount < 2;
}
