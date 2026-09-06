import { z } from 'zod';

export const genderValues = ['MALE', 'FEMALE'] as const;
export const financialStatusValues = ['LIMITED', 'MODERATE', 'STABLE'] as const;

// The backend represents unset optional fields as null.
// Transport contract. Form-specific validation lives in personal-information.schema.ts.
export const personalInformationApiSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  birth_date: z.string(),
  gender: z.enum(genderValues),
  nationality: z.string(),
  country_of_residence: z.string(),
  phone_number: z.string().nullish(),
  city: z.string().nullish(),
  financial_status: z.enum(financialStatusValues).nullish(),
  id_number: z.string().nullish(),
  passport_number: z.string().nullish(),
});

export type PersonalInformation = z.infer<typeof personalInformationApiSchema>;

export const emptyPersonalInformation: Partial<PersonalInformation> = {
  first_name: '',
  last_name: '',
  email: '',
  birth_date: '',
  gender: undefined,
  nationality: '',
  country_of_residence: '',
  phone_number: null,
  city: null,
  financial_status: null,
  id_number: null,
  passport_number: null,
};

export function normalizePersonalInformation(
  value?: Partial<PersonalInformation> | null
): Partial<PersonalInformation> {
  if (!value) return emptyPersonalInformation;
  return {
    ...emptyPersonalInformation,
    ...value,
  };
}
