import { ApiError } from '@/lib/api-client';
import {
  DESCRIPTION_MAX_LENGTH,
  REPORT_TYPES,
  reportRequestSchema,
  reportResponseSchema,
  type ReportRequest,
  type ReportType,
} from '../schemas/report.schema';

export { DESCRIPTION_MAX_LENGTH, REPORT_TYPES };
export type { ReportType };

export interface ReportFormInput {
  reportType: unknown;
  description: string;
}

export type ReportFormErrors = { reportType?: 'required'; description?: 'tooLong' };

export type BuildReportResult =
  { ok: true; body: ReportRequest } | { ok: false; errors: ReportFormErrors };

// Validates the form against the live schema and builds the request body. The
// description limit applies to the input as typed (before trimming), like the
// backend; the body carries the trimmed text, or none when it is blank.
export function buildReportRequest(input: ReportFormInput): BuildReportResult {
  const trimmed = input.description.trim();
  const result = reportRequestSchema.safeParse({
    report_type: input.reportType,
    description: input.description,
  });
  if (result.success) {
    return {
      ok: true,
      body: trimmed
        ? { report_type: result.data.report_type, description: trimmed }
        : { report_type: result.data.report_type },
    };
  }
  const errors: ReportFormErrors = {};
  for (const issue of result.error.issues) {
    if (issue.path[0] === 'report_type') errors.reportType = 'required';
    if (issue.path[0] === 'description') errors.description = 'tooLong';
  }
  return { ok: false, errors };
}

// The single entry point for the 201 response.
export function parseReportResponse(raw: unknown): { id?: number } {
  const result = reportResponseSchema.safeParse(raw);
  return result.success && result.data.id !== undefined ? { id: result.data.id } : {};
}

export type ReportErrorKind =
  'unauthorized' | 'forbidden' | 'notFound' | 'duplicate' | 'invalid' | 'rateLimited' | 'generic';

// Mapped by HTTP status only. The backend `detail` is Arabic prose and is never
// used as a key or shown. 429 is not in the OpenAPI responses but is handled in
// case a rate limiter sits in front of the endpoint.
export function classifyReportError(error: unknown): ReportErrorKind {
  if (!(error instanceof ApiError)) return 'generic';
  switch (error.status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'notFound';
    case 409:
      return 'duplicate';
    case 422:
      return 'invalid';
    case 429:
      return 'rateLimited';
    default:
      return 'generic';
  }
}
