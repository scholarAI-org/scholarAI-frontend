import { z } from 'zod';

// POST /api/scholarships/{scholarship_id}/reports (live OpenAPI).
// ScholarshipReportCreate: report_type is required; description is optional,
// at most 2000 characters of input, trimmed by the backend (blank becomes null).

export const REPORT_TYPES = [
  'expired',
  'incorrect_information',
  'duplicate',
  'suspicious',
  'broken_link',
  'other',
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const DESCRIPTION_MAX_LENGTH = 2000;

// The backend counts characters (code points), not UTF-16 units: an emoji is one.
const countCharacters = (text: string) => [...text].length;

export const reportRequestSchema = z.object({
  report_type: z.enum(REPORT_TYPES),
  description: z
    .string()
    .refine((text) => countCharacters(text) <= DESCRIPTION_MAX_LENGTH)
    .optional(),
});

export type ReportRequest = z.infer<typeof reportRequestSchema>;

// ScholarshipReportResponse. Only the id is read, and even that is optional: a
// 201 means the report exists, so an unreadable body must not look like a failure
// (the student would resubmit and hit the duplicate rule). `message` and the
// backend `detail` are Arabic prose and are never shown.
export const reportResponseSchema = z.object({
  id: z.number().int().positive().optional(),
});
