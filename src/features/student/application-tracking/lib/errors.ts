import { ApiError } from '@/lib/api-client';

export type TrackingContractErrorReason = 'not-array' | 'bad-response';

// A response that does not match the contract. It is an error state, never an
// empty success, and its reason is not user-visible copy.
export class TrackingContractError extends Error {
  readonly reason: TrackingContractErrorReason;
  constructor(reason: TrackingContractErrorReason) {
    super(`TrackingContractError: ${reason}`);
    this.name = 'TrackingContractError';
    this.reason = reason;
  }
}

export type TrackingValidationReason = 'invalid-id' | 'invalid-status' | 'note-too-long';

// Raised before any request when the input cannot be valid.
export class TrackingValidationError extends Error {
  readonly reason: TrackingValidationReason;
  constructor(reason: TrackingValidationReason) {
    super(`TrackingValidationError: ${reason}`);
    this.name = 'TrackingValidationError';
    this.reason = reason;
  }
}

export type TrackingErrorKind =
  'auth' | 'forbidden' | 'not-found' | 'invalid' | 'server' | 'network' | 'contract' | 'unknown';

// Mapped by HTTP status only. The backend `detail` is Arabic prose and is
// never used as a key or shown to the student.
export function classifyTrackingError(error: unknown): TrackingErrorKind {
  if (error instanceof TrackingContractError) return 'contract';
  if (error instanceof TrackingValidationError) return 'invalid';
  if (error instanceof ApiError) {
    const status = error.status ?? 0;
    if (status === 401) return 'auth';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not-found';
    if (status === 422) return 'invalid';
    if (status >= 400) return 'server';
    return 'network';
  }
  if (error instanceof TypeError) return 'network';
  return 'unknown';
}

// 401/403/404/422 and contract errors are final: retrying cannot fix them.
export function shouldRetryTrackingQuery(failureCount: number, error: unknown): boolean {
  const kind = classifyTrackingError(error);
  if (kind === 'auth' || kind === 'forbidden' || kind === 'not-found') return false;
  if (kind === 'invalid' || kind === 'contract') return false;
  return failureCount < 2;
}
