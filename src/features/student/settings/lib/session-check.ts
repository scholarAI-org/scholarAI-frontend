import { ApiError } from '@/lib/api-client';

export type SessionCheckResult = 'valid' | 'expired' | 'unknown';

// Only a 401 from GET /auth/me means the session is gone. Anything else that makes the
// check fail (offline, a 5xx) says nothing about the session, so it is "unknown", and the
// student is left where they are.
export async function confirmSession(
  refetchCurrentUser: () => Promise<{ error: unknown }>,
  onExpired: () => void
): Promise<SessionCheckResult> {
  const { error } = await refetchCurrentUser();
  if (error instanceof ApiError && error.status === 401) {
    onExpired();
    return 'expired';
  }
  return error ? 'unknown' : 'valid';
}
