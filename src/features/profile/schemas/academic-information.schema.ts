import * as z from 'zod';

export const academicLevelValues = ['TAWJIHI', 'BACHELOR', 'MASTER', 'PHD'] as const;
export const fieldOfStudyValues = [
  'SCIENTIFIC',
  'LITERARY',
  'SHARIA',
  'INDUSTRIAL',
  'ENTREPRENEURSHIP_BUSINESS',
  'AGRICULTURAL',
  'HOME_ECONOMICS',
  'ENGINEERING',
  'COMPUTER_SCIENCE',
  'MEDICINE',
  'BUSINESS',
  'ARTS',
  'OTHER',
] as const;
export const gpaSystemValues = ['SCALE_4', 'SCALE_5', 'SCALE_10', 'SCALE_100'] as const;
export const languageValues = ['ARABIC', 'ENGLISH', 'FRENCH'] as const;

export function createAcademicInformationSchema(t: (key: string) => string) {
  return z
    .object({
      currentLevel: z.enum(['', ...academicLevelValues]).refine((value): boolean => value !== '', {
        message: t('validation.currentLevel'),
      }),
      fieldOfStudy: z.enum(['', ...fieldOfStudyValues]).refine((value): boolean => value !== '', {
        message: t('validation.fieldOfStudy'),
      }),
      institution: z
        .string()
        .trim()
        .min(2, { message: t('validation.institution') }),
      graduationYear: z.string().min(1, { message: t('validation.graduationYear') }),
      gpaValue: z
        .string()
        .trim()
        .min(1, { message: t('validation.gpaValue') }),
      gpaSystem: z.enum(['', ...gpaSystemValues]).refine((value): boolean => value !== '', {
        message: t('validation.gpaSystem'),
      }),
      studyLanguage: z.enum(['', ...languageValues]).refine((value): boolean => value !== '', {
        message: t('validation.studyLanguage'),
      }),
    })
    .refine(
      (data) => {
        if (!data.gpaValue || !data.gpaSystem) return true;
        const value = parseFloat(data.gpaValue);
        if (isNaN(value)) return false;

        switch (data.gpaSystem) {
          case 'SCALE_4':
            return value >= 0 && value <= 4;
          case 'SCALE_5':
            return value >= 0 && value <= 5;
          case 'SCALE_10':
            return value >= 0 && value <= 10;
          case 'SCALE_100':
            return value >= 0 && value <= 100;
          default:
            return true;
        }
      },
      {
        message: t('validation.gpaInvalid'),
        path: ['gpaValue'],
      }
    );
}

export type AcademicInformationFormData = z.infer<
  ReturnType<typeof createAcademicInformationSchema>
>;
