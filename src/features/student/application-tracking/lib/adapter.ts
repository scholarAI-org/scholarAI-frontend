import { toSafeHref } from '@/features/student/scholarship-discovery/lib/safe-links';
import type {
  OpportunityType,
  ScholarshipDiscoveryCard,
} from '@/features/student/scholarship-discovery/types';
import {
  noteResponseSchema,
  removeResponseSchema,
  statusResponseSchema,
  trackedItemSchema,
} from '../schemas/tracking';
import type {
  RemoveTrackingResult,
  TrackedItem,
  TrackedList,
  TrackingNoteResult,
  TrackingStatusResult,
} from '../types';
import { TrackingContractError } from './errors';

type WireItem = ReturnType<typeof trackedItemSchema.parse>;

const toCard = (scholarship: WireItem['scholarship']): ScholarshipDiscoveryCard => ({
  ...scholarship,
  opportunity_type: (scholarship.opportunity_type ?? null) as OpportunityType | null,
});

const toItem = (wire: WireItem): TrackedItem => ({
  id: wire.id,
  status: wire.status,
  notes: wire.notes,
  statusChangedAt: wire.status_changed_at,
  createdAt: wire.created_at,
  updatedAt: wire.updated_at,
  scholarship: toCard(wire.scholarship),
  // Rendered only when present and safe; no placeholder otherwise.
  officialUrl: toSafeHref(wire.official_url ?? undefined, ['http:', 'https:']),
});

// GET /api/scholarships/tracked. The body must be an array (anything else is a
// contract error, not an empty list). Items that fail validation are skipped and
// counted so one bad row cannot blank the page. Order is the backend's.
export function parseTrackedList(raw: unknown): TrackedList {
  if (!Array.isArray(raw)) throw new TrackingContractError('not-array');
  const items: TrackedItem[] = [];
  let skipped = 0;
  for (const entry of raw) {
    const parsed = trackedItemSchema.safeParse(entry);
    if (parsed.success) items.push(toItem(parsed.data));
    else skipped += 1;
  }
  return { items, skipped };
}

function parseOrThrow<T>(
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T } },
  raw: unknown
) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new TrackingContractError('bad-response');
  return parsed.data as T;
}

export function parseStatusResponse(raw: unknown): TrackingStatusResult {
  const data = parseOrThrow(statusResponseSchema, raw);
  return {
    id: data.id,
    status: data.status,
    statusChangedAt: data.status_changed_at,
    updatedAt: data.updated_at,
  };
}

export function parseNoteResponse(raw: unknown): TrackingNoteResult {
  const data = parseOrThrow(noteResponseSchema, raw);
  return { id: data.id, notes: data.notes, updatedAt: data.updated_at };
}

export function parseRemoveResponse(raw: unknown): RemoveTrackingResult {
  const data = parseOrThrow(removeResponseSchema, raw);
  return { scholarshipId: data.scholarship_id, isTracked: data.is_tracked, isSaved: data.is_saved };
}
