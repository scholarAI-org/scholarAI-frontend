import { z } from 'zod';
import { parseWith } from './contract-error';

// GET /profile (subset). The backend default is 0, so a missing value is 0;
// anything that is not a number is a contract error, not 0.
const profileCompletionSchema = z.object({
  profile_completion_percentage: z.number().nullish(),
});

export function parseProfileCompletion(raw: unknown): number {
  return (
    parseWith('profile-completion', profileCompletionSchema, raw).profile_completion_percentage ?? 0
  );
}
