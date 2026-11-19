import { ApiError } from '@/lib/api-client';

export type ListErrorReason = 'unauthorized' | 'forbidden' | 'generic';

// Same reasons as the Saved and Tracking pages: session expired (401), access unavailable (403,
// no Retry), anything else (network, 5xx, 404, a bad envelope) generic and retryable. The UI
// never shows the backend's own text.
export function classifyListError(error: unknown): ListErrorReason {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'unauthorized';
    if (error.status === 403) return 'forbidden';
  }
  return 'generic';
}

export const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404;
