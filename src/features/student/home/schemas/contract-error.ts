import type { z } from 'zod';

// A response that does not match the expected shape. Surfaces as the section's
// error state, never as an empty or zero state (FR-037).
export class HomeContractError extends Error {
  constructor(
    public readonly section: string,
    public readonly issues: unknown = []
  ) {
    super(`Home response contract error: ${section}`);
    this.name = 'HomeContractError';
  }
}

export function parseWith<S extends z.ZodType>(
  section: string,
  schema: S,
  raw: unknown
): z.output<S> {
  const result = schema.safeParse(raw);
  if (!result.success) throw new HomeContractError(section, result.error.issues);
  return result.data;
}
