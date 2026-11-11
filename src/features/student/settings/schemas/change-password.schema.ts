import * as z from 'zod';
import {
  RESET_PASSWORD_MIN_LENGTH,
  createResetPasswordValueSchema,
} from '@/features/auth/schemas/password.schema';

type Translate = (key: string, values?: Record<string, string | number>) => string;

// The shared rules ask for their messages by key with no arguments. Settings words the
// length rule as a plural ("at least {count} characters"), so the minimum is supplied here
// and the rule itself stays in password.schema.ts, which is the only copy.
function withMinimumLength(t: Translate) {
  return (key: string) => t(key, key === 'passwordMin' ? { count: RESET_PASSWORD_MIN_LENGTH } : {});
}

export function createChangePasswordSchema(t: Translate) {
  return z
    .object({
      currentPassword: z.string().min(1, { message: t('currentRequired') }),
      // "Required" first: an empty field should say so, not "too short". `pipe` runs the
      // shared rules only once the field is non-empty.
      newPassword: z
        .string()
        .min(1, { message: t('newRequired') })
        .pipe(createResetPasswordValueSchema(withMinimumLength(t))),
      confirmPassword: z.string().min(1, { message: t('confirmRequired') }),
      signOutOtherDevices: z.boolean(),
    })
    .superRefine((values, context) => {
      if (values.confirmPassword && values.newPassword !== values.confirmPassword) {
        context.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: t('passwordMismatch'),
        });
      }
      if (values.currentPassword && values.newPassword === values.currentPassword) {
        context.addIssue({
          code: 'custom',
          path: ['newPassword'],
          message: t('sameAsCurrent'),
        });
      }
    });
}

export type ChangePasswordFormValues = z.infer<ReturnType<typeof createChangePasswordSchema>>;

export const CHANGE_PASSWORD_DEFAULT_VALUES: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  signOutOtherDevices: false,
};
