import {
  getDeadlineStatus,
  type CalendarDate,
} from '@/features/student/scholarship-discovery/lib/deadlines';
import {
  DEADLINE_LIST_LIMIT,
  IN_PROGRESS_STATUSES,
  TERMINAL_TRACKING_STATUSES,
  UPCOMING_WINDOW_DAYS,
} from '../constants';
import type {
  HomeScholarshipCard,
  TrackedApplication,
} from '../schemas/tracked-application.schema';
import { urgencyFor, type DeadlineUrgency } from './urgency';

export type DeadlineOrigin = 'saved' | 'tracked' | 'both';

export interface DeadlineCandidate {
  id: number;
  card: HomeScholarshipCard;
  origin: DeadlineOrigin;
}

export interface UpcomingDeadline {
  id: number;
  title: { default: string; ar: string | null; en: string | null };
  deadline: CalendarDate;
  daysLeft: number;
  urgency: DeadlineUrgency;
  fundingType: string | null;
  studyLevel: string | null;
  origin: DeadlineOrigin;
}

// Applications still being worked on (FR-015).
export const countInProgress = (items: readonly TrackedApplication[]): number =>
  items.filter((item) => IN_PROGRESS_STATUSES.includes(item.status)).length;

// Union of saved and tracked scholarships, one entry per scholarship id. Finished
// applications (accepted/rejected/closed) do not contribute, but a scholarship that
// is also saved still counts through the saved list. Saved fields win on a merge.
export function collectDeadlineCandidates(
  saved: readonly HomeScholarshipCard[],
  tracked: readonly TrackedApplication[]
): DeadlineCandidate[] {
  const byId = new Map<number, DeadlineCandidate>();
  for (const card of saved) byId.set(card.id, { id: card.id, card, origin: 'saved' });
  for (const item of tracked) {
    if (TERMINAL_TRACKING_STATUSES.includes(item.status)) continue;
    const existing = byId.get(item.scholarship.id);
    if (existing) existing.origin = 'both';
    else
      byId.set(item.scholarship.id, {
        id: item.scholarship.id,
        card: item.scholarship,
        origin: 'tracked',
      });
  }
  return [...byId.values()];
}

// The backend types `deadline` as a date; tolerate a date-time by keeping its date part.
const toDateOnly = (value: string | null | undefined): string | null => {
  const match = typeof value === 'string' ? /^(\d{4}-\d{2}-\d{2})/.exec(value.trim()) : null;
  return match ? match[1] : null;
};

const joinLevels = (value: HomeScholarshipCard['study_level']): string | null => {
  if (Array.isArray(value)) return value.join(', ') || null;
  return value?.trim() || null;
};

// Eligible: a valid calendar deadline from today up to UPCOMING_WINDOW_DAYS ahead,
// counted on the student's LOCAL calendar day. `items` is the nearest few; `count`
// is everything in the window.
export function deriveUpcomingDeadlines({
  saved,
  tracked,
  now,
}: {
  saved: readonly HomeScholarshipCard[];
  tracked: readonly TrackedApplication[];
  now: Date;
}): { items: UpcomingDeadline[]; count: number } {
  const upcoming: UpcomingDeadline[] = [];
  for (const candidate of collectDeadlineCandidates(saved, tracked)) {
    const { card } = candidate;
    const status = getDeadlineStatus(toDateOnly(card.deadline), Boolean(card.no_deadline), now);
    if (status.kind !== 'today' && status.kind !== 'upcoming') continue;
    const daysLeft = status.kind === 'today' ? 0 : status.daysLeft;
    if (daysLeft > UPCOMING_WINDOW_DAYS) continue;
    upcoming.push({
      id: candidate.id,
      title: { default: card.title, ar: card.title_ar ?? null, en: card.title_en ?? null },
      deadline: status.date,
      daysLeft,
      urgency: urgencyFor(daysLeft),
      fundingType: card.funding_type?.trim() || null,
      studyLevel: joinLevels(card.study_level),
      origin: candidate.origin,
    });
  }
  upcoming.sort((a, b) => a.daysLeft - b.daysLeft || a.id - b.id);
  return { items: upcoming.slice(0, DEADLINE_LIST_LIMIT), count: upcoming.length };
}
