import * as z from 'zod';
import { createResetPasswordValueSchema } from './password.schema';

export function createResetPasswordSchema(t: (key: string) => string) {
  return z
    .object({
      new_password: createResetPasswordValueSchema(t),
      confirm_password: z.string().min(1, { message: t('confirmRequired') }),
    })
    .refine((values) => values.new_password === values.confirm_password, {
      message: t('passwordMismatch'),
      path: ['confirm_password'],
    });
}

export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>;
