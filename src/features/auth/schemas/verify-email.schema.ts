import * as z from 'zod';

export function createVerifyEmailSchema(t: (key: string) => string) {
  return z.object({
    otp: z
      .string()
      .min(1, { message: t('otpRequired') })
      .regex(/^\d{6}$/, { message: t('otpInvalid') }),
  });
}

export type VerifyEmailFormData = z.infer<ReturnType<typeof createVerifyEmailSchema>>;
