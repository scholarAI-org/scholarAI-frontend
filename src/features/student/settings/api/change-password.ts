import { apiClient } from '@/lib/api-client';

// Exactly the three fields the backend contract needs. The `old_password` and
// `revoke_other_sessions` aliases are never sent, and neither is the confirmation.
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  invalidate_other_sessions: boolean;
}

export interface ChangePasswordResponse {
  message: string;
}

export function changePassword(payload: ChangePasswordRequest) {
  return apiClient<ChangePasswordResponse>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
