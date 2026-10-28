import { z } from 'zod';
import { TRACKING_STATUSES } from '@/features/student/application-tracking/constants';

// GET and PUT /api/scholarships/{scholarship_id}/tracking ->
// ScholarshipTrackingResponse. status and updated_at are null when the
// scholarship exists but this student is not tracking it. A status outside the
// known six fails the parse: reading it as "not tracked" would let the next
// click overwrite a real application.
export const scholarshipTrackingSchema = z.object({
  status: z.enum(TRACKING_STATUSES).nullable(),
  updated_at: z
    .unknown()
    .transform((value) => (typeof value === 'string' && value.trim() ? value : undefined))
    .optional(),
});
