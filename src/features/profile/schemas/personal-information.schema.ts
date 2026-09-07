import * as z from 'zod';
import { genderValues, financialStatusValues } from './personal-information-api.schema';

// Same international format accepted by the backend. The phone UI always
// combines the selected calling code with the local number before validation.
const phoneRegex = /^\+[1-9]\d{7,14}$/;
const nationalIdRegex = /^[0-9]{9}$/;
const passportRegex = /^[A-Z0-9]{6,9}$/i;
const minimumAge = 16;

function isAtLeastAge(value: string, age: number) {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!dateParts) {
    return false;
  }

  const [, year, month, day] = dateParts;
  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate.getFullYear() !== Number(year) ||
    birthDate.getMonth() !== Number(month) - 1 ||
    birthDate.getDate() !== Number(day)
  ) {
    return false;
  }

  const today = new Date();
  const ageDate = new Date(
    birthDate.getFullYear() + age,
    birthDate.getMonth(),
    birthDate.getDate()
  );

  return ageDate <= today;
}

export function createPersonalInformationSchema(t: (key: string) => string) {
  return z.object({
    firstName: z
      .string()
      .trim()
      .regex(/^[\u0600-\u06FF\s]+$/, { message: t('validation.firstNameArabic') })
      .refine((val) => val.trim().split(/\s+/).length >= 4, {
        message: t('validation.firstNameFourParts'),
      }),
    lastName: z
      .string()
      .trim()
      .regex(/^[a-zA-Z\s]+$/, { message: t('validation.lastNameEnglish') })
      .refine((val) => val.trim().split(/\s+/).length >= 4, {
        message: t('validation.lastNameFourParts'),
      }),
    email: z
      .string()
      .trim()
      .pipe(z.email({ message: t('validation.email') })),
    phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || phoneRegex.test(value), {
        message: t('validation.phone'),
      }),
    gender: z.enum(['', ...genderValues]).refine((value): boolean => value !== '', {
      message: t('validation.gender'),
    }),
    birthDate: z
      .string()
      .min(1, { message: t('validation.birthDate') })
      .refine((value) => isAtLeastAge(value, minimumAge), {
        message: t('validation.minimumAge'),
      }),
    nationalityCode: z.string().regex(/^[A-Z]{2}$/, { message: t('validation.nationality') }),
    residenceCountryCode: z.string().regex(/^[A-Z]{2}$/, { message: t('validation.residence') }),
    nationalId: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || nationalIdRegex.test(value.replace(/\s/g, '')), {
        message: t('validation.nationalId'),
      }),
    passportNumber: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || passportRegex.test(value.replace(/\s/g, '')), {
        message: t('validation.passport'),
      }),
    city: z.string().trim().optional().or(z.literal('')),
    financialSituation: z
      .enum(['', ...financialStatusValues])
      .refine((value): boolean => value !== '', {
        message: t('validation.financialSituation'),
      }),
  });
}

export type PersonalInformationFormData = z.infer<
  ReturnType<typeof createPersonalInformationSchema>
>;
