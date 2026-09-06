import type { ProfileCallingCodeOption } from '@/components/profile/types';

export function phoneDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function composeInternationalPhone(
  option: ProfileCallingCodeOption | undefined,
  localValue: string
) {
  const normalizedLocalNumber = phoneDigits(localValue).replace(/^0+/, '');
  return normalizedLocalNumber ? `${option?.dialCode ?? ''}${normalizedLocalNumber}` : '';
}

export function findCallingCodeForPhone(value: string, options: ProfileCallingCodeOption[]) {
  const internationalDigits = phoneDigits(value);
  if (!internationalDigits) return null;

  return [...options]
    .sort((a, b) => phoneDigits(b.dialCode).length - phoneDigits(a.dialCode).length)
    .find((option) => internationalDigits.startsWith(phoneDigits(option.dialCode)));
}
