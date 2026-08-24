import * as z from 'zod';

export function createForgotPasswordSchema(t: (key: string) => string) {
  return z.object({
    email: z.email({ message: t('emailInvalid') }),
  });
}

export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
