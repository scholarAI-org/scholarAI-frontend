import * as z from 'zod';
import { studyStatusValues } from './academic-information-api.schema';

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
      fieldOfStudy: z
        .string()
        .trim()
        .min(1, { message: t('validation.fieldOfStudy') }),
      fieldOfStudyOpenAlexId: z.string().nullable(),
      institution: z.string().trim().optional().or(z.literal('')),
      graduationYear: z.string().min(1, { message: t('validation.graduationYear') }),
      studyStatus: z.enum(['', ...studyStatusValues]).refine((value): boolean => value !== '', {
        message: t('validation.studyStatus'),
      }),
      targetFieldOfStudy: z
        .string()
        .trim()
        .min(1, { message: t('validation.targetFieldOfStudy') }),
      targetFieldOfStudyOpenAlexId: z
        .string()
        .nullable()
        .refine((val) => val !== null && val !== '', {
          message: t('validation.targetFieldOfStudy'),
        }),
      researchSpecialization: z.string().nullable(),
      researchSpecializationOpenAlexId: z.string().nullable(),
      gpaValue: z
        .string()
        .trim()
        .min(1, { message: t('validation.gpaValue') }),
      gpaSystem: z.enum(['', ...gpaSystemValues]).refine((value): boolean => value !== '', {
        message: t('validation.gpaSystem'),
      }),
      studyLanguage: z
        .enum(['', ...languageValues])
        .optional()
        .or(z.literal('')),
    })
    .refine(
      (data) => {
        if (!data.gpaValue || !data.gpaSystem) return true;
        const value = parseFloat(data.gpaValue);
        if (isNaN(value) || value < 0) return false;

        switch (data.gpaSystem) {
          case 'SCALE_4':
            return value <= 4;
          case 'SCALE_5':
            return value <= 5;
          case 'SCALE_10':
            return value <= 10;
          case 'SCALE_100':
            return value <= 100;
          default:
            return true;
        }
      },
      {
        message: t('validation.gpaInvalid'),
        path: ['gpaValue'],
      }
    )
    .refine(
      (data) => {
        if (data.currentLevel !== 'TAWJIHI') {
          return data.fieldOfStudyOpenAlexId !== null && data.fieldOfStudyOpenAlexId !== '';
        }
        return true;
      },
      {
        message: t('validation.fieldOfStudy'),
        path: ['fieldOfStudy'],
      }
    );
}

export type AcademicInformationFormData = z.infer<
  ReturnType<typeof createAcademicInformationSchema>
>;
