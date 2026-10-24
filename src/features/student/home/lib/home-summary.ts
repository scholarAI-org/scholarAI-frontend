import type {
  HomeScholarshipCard,
  TrackedApplication,
} from '../schemas/tracked-application.schema';
import {
  countInProgress,
  deriveUpcomingDeadlines,
  type UpcomingDeadline,
} from './derive-home-summary';
import { getSectionState, type QueryLike, type SectionState } from './section-state';

export interface QueryResult<T> extends QueryLike {
  data: T | undefined;
}

export interface HomeSummary {
  saved: { state: SectionState; value: number };
  inProgress: { state: SectionState; value: number };
  upcoming: { state: SectionState; value: number };
  deadlines: { state: SectionState; items: UpcomingDeadline[] };
}

// One state per card/section, each from only the queries it depends on, so a failing
// source never blanks anything else. Days-left needs the student's local day (`now`),
// which is unknown until the page has mounted, so those sections wait for it.
export function buildHomeSummary({
  saved,
  tracked,
  now,
}: {
  saved: QueryResult<readonly HomeScholarshipCard[]>;
  tracked: QueryResult<readonly TrackedApplication[]>;
  now: Date | null;
}): HomeSummary {
  const savedItems = saved.data ?? [];
  const trackedItems = tracked.data ?? [];

  const dependent = getSectionState([saved, tracked]);
  const derived =
    dependent === 'ready' && now
      ? deriveUpcomingDeadlines({ saved: savedItems, tracked: trackedItems, now })
      : null;
  const dependentState: SectionState = dependent === 'ready' && !derived ? 'loading' : dependent;

  return {
    saved: { state: getSectionState([saved]), value: savedItems.length },
    inProgress: { state: getSectionState([tracked]), value: countInProgress(trackedItems) },
    upcoming: { state: dependentState, value: derived?.count ?? 0 },
    deadlines: {
      state: derived && derived.items.length === 0 ? 'empty' : dependentState,
      items: derived?.items ?? [],
    },
  };
}
