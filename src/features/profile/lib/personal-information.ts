import {
  personalInformationApiSchema,
  type PersonalInformation,
} from '../schemas/personal-information-api.schema';
import {
  createPersonalInformationSchema,
  type PersonalInformationFormData,
} from '../schemas/personal-information.schema';

export const emptyPersonalInformation: PersonalInformationFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  birthDate: '',
  nationalityCode: '',
  residenceCountryCode: '',
  nationalId: '',
  passportNumber: '',
  city: '',
  financialSituation: '',
};

export const personalInformationFieldMap = {
  first_name: 'firstName',
  last_name: 'lastName',
  email: 'email',
  birth_date: 'birthDate',
  gender: 'gender',
  nationality: 'nationalityCode',
  country_of_residence: 'residenceCountryCode',
  phone_number: 'phone',
  city: 'city',
  financial_status: 'financialSituation',
  id_number: 'nationalId',
  passport_number: 'passportNumber',
} as const satisfies Record<keyof PersonalInformation, keyof PersonalInformationFormData>;

export function toPersonalInformationForm(
  data?: Partial<PersonalInformation> | null
): PersonalInformationFormData {
  if (!data) return emptyPersonalInformation;
  return {
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    email: data.email ?? '',
    birthDate: data.birth_date ? data.birth_date.slice(0, 10) : '',
    gender: data.gender ?? '',
    nationalityCode: (data.nationality ?? '').toUpperCase(),
    residenceCountryCode: (data.country_of_residence ?? '').toUpperCase(),
    phone: data.phone_number ?? '',
    city: data.city ?? '',
    financialSituation: data.financial_status ?? '',
    nationalId: data.id_number ?? '',
    passportNumber: data.passport_number ?? '',
  };
}

export function toPersonalInformationPayload(
  data: PersonalInformationFormData
): PersonalInformation {
  return personalInformationApiSchema.parse({
    first_name: data.firstName.trim(),
    last_name: data.lastName.trim(),
    email: data.email.trim(),
    birth_date: data.birthDate,
    gender: data.gender,
    nationality: data.nationalityCode,
    country_of_residence: data.residenceCountryCode,
    phone_number: data.phone?.replace(/\D/g, '')
      ? `+${data.phone.replace(/\D/g, '').replace(/^0+/, '')}`
      : undefined,
    city: data.city?.trim() || undefined,
    financial_status: data.financialSituation || undefined,
    id_number: data.nationalId?.replace(/\s/g, '') || undefined,
    passport_number: data.passportNumber?.replace(/\s/g, '').toUpperCase() || undefined,
  });
}

const requiredFields = [
  'firstName',
  'lastName',
  'email',
  'birthDate',
  'gender',
  'nationalityCode',
  'residenceCountryCode',
] as const;
const completionSchema = createPersonalInformationSchema((key) => key);

// Only required personal fields are counted. Other sections have no backend contract yet.
export function getPersonalInformationCompletion(
  values: Partial<PersonalInformationFormData>
): number {
  const completed = requiredFields.filter(
    (field) => completionSchema.shape[field].safeParse(values[field]).success
  ).length;
  return Math.round((completed / requiredFields.length) * 100);
}
