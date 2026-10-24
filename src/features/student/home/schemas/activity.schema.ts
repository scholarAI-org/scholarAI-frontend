import { z } from 'zod';
import { TRACKING_STATUSES, type TrackingStatus } from '../constants';
import { parseWith } from './contract-error';

// REQUESTED contract (backend ask: student activity feed).
// See specs/009-student-home/contracts/requested-backend.openapi.yaml.
export const ACTIVITY_TYPES = [
  'new_recommendation',
  'deadline_reminder',
  'scholarship_saved',
  'application_status_changed',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

const scholarshipRefSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  title_ar: z.string().nullish(),
  title_en: z.string().nullish(),
});

const activityItemSchema = z
  .object({
    id: z.number().int(),
    type: z.enum(ACTIVITY_TYPES),
    occurred_at: z.iso.datetime({ offset: true }),
    scholarship: scholarshipRefSchema,
    data: z.object({
      days_left: z.number().int().min(0).optional(),
      new_status: z.enum(TRACKING_STATUSES).optional(),
    }),
  })
  .superRefine((item, ctx) => {
    if (item.type === 'deadline_reminder' && item.data.days_left === undefined) {
      ctx.addIssue({ code: 'custom', path: ['data', 'days_left'], message: 'required' });
    }
    if (item.type === 'application_status_changed' && item.data.new_status === undefined) {
      ctx.addIssue({ code: 'custom', path: ['data', 'new_status'], message: 'required' });
    }
  });

export interface ActivityItem {
  id: number;
  type: ActivityType;
  occurredAt: string;
  scholarship: { id: number; title: string; titleAr: string | null; titleEn: string | null };
  data: { daysLeft?: number; newStatus?: TrackingStatus };
}

const isKnownType = (value: unknown): value is ActivityType =>
  (ACTIVITY_TYPES as readonly unknown[]).includes(value);

export function parseActivityFeed(raw: unknown): ActivityItem[] {
  const feed = parseWith('activity', z.object({ items: z.array(z.unknown()) }), raw);
  return feed.items
    .filter((item) => {
      // A type this version does not know is skipped, so a newer backend cannot break Home.
      const type = (item as { type?: unknown } | null)?.type;
      return typeof type !== 'string' || isKnownType(type);
    })
    .map((item) => {
      const parsed = parseWith('activity', activityItemSchema, item);
      return {
        id: parsed.id,
        type: parsed.type,
        occurredAt: parsed.occurred_at,
        scholarship: {
          id: parsed.scholarship.id,
          title: parsed.scholarship.title,
          titleAr: parsed.scholarship.title_ar ?? null,
          titleEn: parsed.scholarship.title_en ?? null,
        },
        data: { daysLeft: parsed.data.days_left, newStatus: parsed.data.new_status },
      };
    });
}
