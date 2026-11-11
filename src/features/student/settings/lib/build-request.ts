import type { ChangePasswordRequest } from '../api/change-password';
import type { ChangePasswordFormValues } from '../schemas/change-password.schema';

// Builds the body from named fields instead of spreading the form values, so a field added
// to the form later (the confirmation today) can never reach the backend by accident.
export function buildChangePasswordRequest(
  values: Pick<ChangePasswordFormValues, 'currentPassword' | 'newPassword' | 'signOutOtherDevices'>
): ChangePasswordRequest {
  return {
    current_password: values.currentPassword,
    new_password: values.newPassword,
    invalidate_other_sessions: values.signOutOtherDevices,
  };
}
