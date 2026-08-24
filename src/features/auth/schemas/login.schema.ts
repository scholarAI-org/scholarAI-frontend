import * as z from 'zod';

export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.email({ message: t('emailInvalid') }),
    password: z.string().min(6, { message: t('passwordMin') }),
  });
}

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
