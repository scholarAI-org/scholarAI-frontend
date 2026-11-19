import { z } from 'zod';

// Wire shapes of the four BE-13 endpoints (see specs/011-student-notifications/contracts).
// With params.ts, the only file that knows the backend's field names (FR-090).
// Schemas strip unknown keys, so extra fields from a newer backend never fail a page (FR-091).

// A response that does not match the expected envelope. Surfaces as the error state, never as
// an empty state (FR-054).
export class NotificationsContractError extends Error {
  constructor(
    public readonly what: string,
    public readonly issues: unknown = []
  ) {
    super(`Notifications contract error: ${what}`);
    this.name = 'NotificationsContractError';
  }
}

export function parseWire<S extends z.ZodType>(what: string, schema: S, raw: unknown): z.output<S> {
  const result = schema.safeParse(raw);
  if (!result.success) throw new NotificationsContractError(what, result.error.issues);
  return result.data;
}

export const listEnvelopeSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1),
  total_pages: z.number().int().min(0),
});

// The fields every item has, whatever its type. `params` and `action` are read separately.
export const itemShellSchema = z.object({
  id: z.number().int().positive(),
  created_at: z.iso.datetime({ offset: true }),
  is_read: z.boolean(),
});

export const markReadAnswerSchema = z.object({
  id: z.number().int(),
  is_read: z.boolean(),
  read_at: z.iso.datetime({ offset: true }).nullish(),
});

export const readAllAnswerSchema = z.object({ updated: z.number().int().min(0) });
