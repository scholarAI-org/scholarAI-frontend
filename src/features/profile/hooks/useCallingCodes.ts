import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

const callingCodeCountrySchema = z.object({
  name: z.string().min(1),
  alpha2Code: z.string().regex(/^[A-Z]{2}$/),
  callingCodes: z.array(z.string()).min(1),
  flag: z.string().optional(),
});

const callingCodesResponseSchema = z.array(callingCodeCountrySchema);

export interface CallingCodeOption {
  value: string;
  label: string;
  countryCode: string;
  dialCode: string;
  flag?: string;
}

async function fetchCallingCodes({
  signal,
}: {
  signal: AbortSignal;
}): Promise<CallingCodeOption[]> {
  const response = await fetch(
    'https://countries.dev/countries?fields=name,alpha2Code,callingCodes,flag&limit=300',
    { signal }
  );

  if (!response.ok) {
    throw new Error('Unable to load calling codes');
  }

  const parsed = callingCodesResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error('Invalid calling codes response');
  }

  return parsed.data
    .flatMap((country) =>
      country.callingCodes.map((code, index) => {
        const dialCode = `+${code.replace(/\D/g, '')}`;
        return {
          value: `${country.alpha2Code}-${index}`,
          countryCode: country.alpha2Code,
          dialCode,
          flag: country.flag,
          label: `${country.flag ?? ''} ${country.name} (${dialCode})`.trim(),
        };
      })
    )
    .filter((option) => /^\+[1-9]\d{0,3}$/.test(option.dialCode))
    .sort((a, b) => a.label.localeCompare(b.label, 'en'));
}

export function useCallingCodes() {
  return useQuery({
    queryKey: ['calling-codes'],
    queryFn: fetchCallingCodes,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 2,
  });
}
