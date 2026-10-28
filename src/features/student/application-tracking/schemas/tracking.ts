import { z } from 'zod';
import { TRACKING_STATUSES } from '../constants';

export const trackingStatusSchema = z.enum(TRACKING_STATUSES);

// Optional text the backend may send as null, omit, or (wrongly) as another
// type: anything but a string is treated as absent instead of failing the item.
const optionalText = z.string().nullish().catch(null);

// Reuses the discovery card shape (ScholarshipDiscoveryCard). Only what the page
// cannot work without is strict: a positive integer id, a title and is_saved.
export const trackedScholarshipSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  title_ar: optionalText,
  title_en: optionalText,
  slug: optionalText,
  organization_name: optionalText,
  university_name: optionalText,
  country: optionalText,
  study_level: z
    .union([z.array(z.string()), z.string()])
    .nullish()
    .catch(null),
  funding_type: optionalText,
  opportunity_type: optionalText,
  image_url: optionalText,
  deadline: optionalText,
  no_deadline: z.boolean().nullish().catch(null),
  is_saved: z.boolean(),
});

// StudentScholarshipTrackingResponse. Timestamps are plain strings on purpose
// (BE-08 pending): lib/timestamps decides what can be shown.
export const trackedItemSchema = z.object({
  id: z.number().int().positive(),
  status: trackingStatusSchema,
  notes: z.string().nullable(),
  status_changed_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  scholarship: trackedScholarshipSchema,
  // BE-03 (pending). Absent today.
  official_url: optionalText,
});

// ApplicationStatusResponse (only the fields the page reads).
export const statusResponseSchema = z.object({
  id: z.number().int().positive(),
  status: trackingStatusSchema,
  status_changed_at: z.string(),
  updated_at: z.string(),
});

// ApplicationNoteResponse (only the fields the page reads).
export const noteResponseSchema = z.object({
  id: z.number().int().positive(),
  notes: z.string().nullable(),
  updated_at: z.string(),
});

// RemoveApplicationTrackingResponse.
export const removeResponseSchema = z.object({
  scholarship_id: z.number().int().nullable(),
  is_tracked: z.boolean().default(false),
  is_saved: z.boolean().nullable(),
});

// PUT /api/scholarships/{id}/tracking (BE-02): { status, updated_at }.
export const startResponseSchema = z.object({
  status: trackingStatusSchema,
  updated_at: z.string(),
});
