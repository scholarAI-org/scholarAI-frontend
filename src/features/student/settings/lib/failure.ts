import { ApiError } from '@/lib/api-client';

export type ChangePasswordField = 'currentPassword' | 'newPassword';

// What went wrong, in the terms the form cares about. Built from the thrown value alone, so
// the rules below can be tested without React.
export type ChangePasswordFailure =
  // 400: the current password is wrong, or the new one equals it. `message` is the backend's
  // own `detail`, or null when it sent none.
  | { kind: 'rejected'; message: string | null }
  // 422: the body failed validation. Entries are the mappable per-field messages; `unmapped`
  // holds the first message whose location names no field of this form.
  | {
      kind: 'validation';
      fields: Partial<Record<ChangePasswordField, string>>;
      unmapped: string | null;
    }
  // 401: not signed in (any more).
  | { kind: 'unauthorized' }
  // Network failure, 5xx, or any status the contract does not list.
  | { kind: 'unavailable' };

// `apiClient` has no usable `detail` to report when the backend sends none, and falls back to
// this text. It is internal wording, never something to show a student.
export const API_CLIENT_FALLBACK_MESSAGE = 'error happen';

// 422 `loc` ends with the offending body key. `old_password` is the backend's alias for
// `current_password`.
const FIELD_BY_BODY_KEY: Record<string, ChangePasswordField> = {
  current_password: 'currentPassword',
  old_password: 'currentPassword',
  new_password: 'newPassword',
};

function usableMessage(message: unknown): string | null {
  if (typeof message !== 'string') return null;
  const trimmed = message.trim();
  return trimmed && trimmed !== API_CLIENT_FALLBACK_MESSAGE ? trimmed : null;
}

export function classifyChangePasswordError(error: unknown): ChangePasswordFailure {
  if (!(error instanceof ApiError)) return { kind: 'unavailable' };

  if (error.status === 400) return { kind: 'rejected', message: usableMessage(error.message) };
  if (error.status === 401) return { kind: 'unauthorized' };

  if (error.status === 422) {
    const fields: Partial<Record<ChangePasswordField, string>> = {};
    let unmapped: string | null = null;
    for (const detail of error.details) {
      const message = usableMessage(detail?.msg);
      if (!message) continue;
      const key = Array.isArray(detail.loc) ? detail.loc[detail.loc.length - 1] : undefined;
      const field = typeof key === 'string' ? FIELD_BY_BODY_KEY[key] : undefined;
      if (field) fields[field] ??= message;
      else unmapped ??= message;
    }
    // A 422 whose `detail` was not an array (or was empty) carries its text in `message`.
    if (!Object.keys(fields).length && !unmapped) unmapped = usableMessage(error.message);
    return { kind: 'validation', fields, unmapped };
  }

  return { kind: 'unavailable' };
}

// Keys of the `Settings.feedback` messages. The component supplies the translator.
export type ChangePasswordFeedbackKey = 'rejected' | 'invalid' | 'sessionExpired' | 'unavailable';

export interface ChangePasswordFeedback {
  // Text for the form-level alert, or null when the errors all sit on fields.
  formError: string | null;
  fieldErrors: Partial<Record<ChangePasswordField, string>>;
  // 400: the typed passwords are no longer worth keeping.
  clearPasswords: boolean;
  // 401: re-check the session and send the student to login if it is gone.
  recheckSession: boolean;
}

export function describeChangePasswordFailure(
  failure: ChangePasswordFailure,
  translate: (key: ChangePasswordFeedbackKey) => string
): ChangePasswordFeedback {
  switch (failure.kind) {
    case 'rejected':
      return {
        formError: failure.message ?? translate('rejected'),
        fieldErrors: {},
        clearPasswords: true,
        recheckSession: false,
      };
    case 'validation': {
      const hasFields = Object.keys(failure.fields).length > 0;
      return {
        formError: failure.unmapped ?? (hasFields ? null : translate('invalid')),
        fieldErrors: failure.fields,
        clearPasswords: false,
        recheckSession: false,
      };
    }
    case 'unauthorized':
      return {
        formError: translate('sessionExpired'),
        fieldErrors: {},
        clearPasswords: false,
        recheckSession: true,
      };
    case 'unavailable':
      return {
        formError: translate('unavailable'),
        fieldErrors: {},
        clearPasswords: false,
        recheckSession: false,
      };
  }
}
