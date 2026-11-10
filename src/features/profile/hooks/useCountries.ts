import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

const countriesSchema = z
  .array(
    z.object({
      value: z.string().regex(/^[A-Z]{2}$/),
      label: z.string().min(1),
      nationalityLabel: z.string().min(1),
    })
  )
  .min(1);

export type CountryOption = z.infer<typeof countriesSchema>[number];

// Error messages are for logs only; the UI shows its own translated copy.
async function fetchCountries({ signal }: { signal: AbortSignal }): Promise<CountryOption[]> {
  const response = await fetch('/data/countries.json', { signal });

  if (!response.ok) {
    throw new Error(`Countries list request failed: HTTP ${response.status}`);
  }

  const result = countriesSchema.safeParse(await response.json());

  if (!result.success) {
    throw new Error('Countries list has an invalid format');
  }

  return result.data;
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 2,
  });
}
