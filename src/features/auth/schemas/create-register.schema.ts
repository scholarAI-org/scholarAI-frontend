import * as z from 'zod';

// Mirrors the backend UserCreate password rule from docs/api/openapi.json:
// at least 8 characters, at least one digit, at least one special character
// from !@#$%^&*(),.?":{}|<>.
const PASSWORD_DIGIT = /\d/;
const PASSWORD_SPECIAL = /[!@#$%^&*(),.?":{}|<>]/;

export function createRegisterSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(3, { message: t('nameMin') }),
    email: z.email({ message: t('emailInvalid') }),
    password: z
      .string()
      .min(8, { message: t('passwordRule') })
      .regex(PASSWORD_DIGIT, { message: t('passwordRule') })
      .regex(PASSWORD_SPECIAL, { message: t('passwordRule') }),
    agreeTerms: z.literal(true, { message: t('agreeTermsRequired') }),
  });
}

export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;
