import * as z from 'zod';

export function createRegisterSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(3, { message: t('nameMin') }),
    email: z.email({ message: t('emailInvalid') }),
    password: z.string().min(6, { message: t('passwordMin') }),
    agreeTerms: z.literal(true, { message: t('agreeTermsRequired') }),
  });
}

export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;
