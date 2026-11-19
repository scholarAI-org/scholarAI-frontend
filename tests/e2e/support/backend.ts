import { E2E_URLS } from './env';

// Client for the fake backend's /__e2e/* control API (tests/e2e/fake-backend/server.mjs).
// The real backend has no such API, so these helpers only work in local mode.

export interface SeedOptions {
  email?: string;
  name?: string;
  password?: string;
  /** Personal-info row as the backend stores it; omit for a new account with no profile. */
  personal?: Record<string, string | null>;
  completion?: number;
  /** Scholarship ids the user has saved. */
  saved?: number[];
  tracked?: { scholarship_id: number; status?: string; notes?: string | null }[];
  /** The fake ends the signed-in session when the password changes (Settings re-checks it). */
  revokeSessionOnPasswordChange?: boolean;
  /** Notifications the user already has (BE-13 rows, see `notification()`), newest by `minutes_ago`. */
  notifications?: SeedNotification[];
}

export type NotificationType =
  | 'deadline_reminder'
  | 'scholarship_match'
  | 'saved_scholarship_updated'
  | 'scholarship_archived'
  | 'profile_incomplete'
  | 'document_analysis_ready';

export interface SeedNotification {
  type: string;
  params?: Record<string, unknown>;
  /** How long ago it was created; the default is now. `created_at` overrides it. */
  minutes_ago?: number;
  created_at?: string;
  is_read?: boolean;
  action?: { type: string; target_id: number | null } | null;
}

export interface SeededUser {
  id: number;
  email: string;
  password: string;
}

export interface BackendState {
  verified: boolean;
  /** Open sessions (signed-in browsers) for this user. */
  sessionCount: number;
  personal: Record<string, string | null> | null;
  savedIds: number[];
  tracked: { id: number; scholarship_id: number; status: string; notes: string | null }[];
  notifications: { id: number; type: string; is_read: boolean; read_at: string | null }[];
}

export interface LoggedRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  status: number;
  body: unknown;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${E2E_URLS.fakeBackend}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Fake backend ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

export interface CatalogScholarship {
  id: number;
  title: string;
  title_ar: string;
  title_en: string;
  country: string;
  study_level: string[];
  funding_type: string;
  opportunity_type: string;
  deadline: string | null;
}

/** The scholarships the fake serves. Tests derive their expected results from this list. */
export const fetchCatalog = () => call<CatalogScholarship[]>('/__e2e/catalog');

/** The title the UI shows for a scholarship in the given language. */
export const titleIn = (locale: 'en' | 'ar', scholarship: CatalogScholarship) =>
  locale === 'ar' ? scholarship.title_ar : scholarship.title_en;

let counter = 0;
export const uniqueEmail = (label = 'student') =>
  `${label}-${process.pid}-${Date.now().toString(36)}-${counter++}@e2e.test`;

export const seedStudent = (options: SeedOptions = {}) =>
  call<SeededUser>('/__e2e/users', {
    method: 'POST',
    body: JSON.stringify({ email: uniqueEmail(), ...options }),
  });

export const backendState = (email: string) =>
  call<BackendState>(`/__e2e/state?email=${encodeURIComponent(email)}`);

export const backendRequests = (email: string, path?: string) =>
  call<LoggedRequest[]>(
    `/__e2e/requests?email=${encodeURIComponent(email)}${path ? `&path=${encodeURIComponent(path)}` : ''}`
  );

// ---------------------------------------------------------------- notifications (BE-13)

/** Valid params and the action the backend would attach, per type. Override what a test needs. */
const NOTIFICATION_DEFAULTS: Record<NotificationType, Omit<SeedNotification, 'type'>> = {
  deadline_reminder: {
    params: {
      scholarship_id: 7,
      scholarship_title: 'DAAD Scholarship',
      days_left: 17,
      deadline: '2026-09-15',
      reminder_index: 1,
      reminder_total: 2,
      missing_documents: ['recommendation_letters'],
    },
    action: { type: 'open_scholarship', target_id: 7 },
  },
  scholarship_match: {
    params: {
      scholarship_id: 8,
      scholarship_title: 'Erasmus Mundus Joint Masters',
      matched_count: 4,
      total_count: 5,
    },
    action: { type: 'open_scholarship', target_id: 8 },
  },
  saved_scholarship_updated: {
    params: {
      scholarship_id: 9,
      scholarship_title: 'Chevening',
      change: 'language_requirement_added',
    },
    action: { type: 'open_scholarship', target_id: 9 },
  },
  scholarship_archived: {
    params: { scholarship_id: 10, scholarship_title: 'Islamic University 2025' },
    action: null,
  },
  profile_incomplete: {
    params: { remaining_percent: 18, threshold_percent: 70 },
    action: { type: 'open_profile', target_id: null },
  },
  document_analysis_ready: {
    params: { suggestions_count: 8, target_scholarship_title: 'DAAD Scholarship' },
    action: { type: 'open_document_analysis', target_id: null },
  },
};

/** One seed row of the given type, with the defaults above and any overrides. */
export const notification = (
  type: NotificationType | string,
  overrides: Partial<SeedNotification> = {}
): SeedNotification => ({
  type,
  ...(NOTIFICATION_DEFAULTS[type as NotificationType] ?? { params: {}, action: null }),
  ...overrides,
});

/** Adds notifications to an existing user, for example mid-test to see the poll pick them up. */
export const addNotifications = (email: string, items: SeedNotification[]) =>
  call<{ ids: number[] }>('/__e2e/notifications', {
    method: 'POST',
    body: JSON.stringify({ email, items }),
  });

export type NotificationEndpoint = 'list' | 'unread-count' | 'mark-read' | 'read-all';

/** Makes the next `times` answers of one endpoint fail with `status` (default 500, once). */
export const failNext = (email: string, endpoint: NotificationEndpoint, status = 500, times = 1) =>
  call('/__e2e/notifications/fault', {
    method: 'POST',
    body: JSON.stringify({ email, endpoint, status, times }),
  });

/** Slows one endpoint down for a user; `ms` 0 removes the delay. */
export const delayEndpoint = (email: string, endpoint: NotificationEndpoint, ms: number) =>
  call('/__e2e/notifications/delay', {
    method: 'POST',
    body: JSON.stringify({ email, endpoint, ms }),
  });

/** What the backend received on the notification endpoints for a user, oldest first. */
export const notificationRequests = async (email: string) =>
  (await backendRequests(email)).filter((request) => request.path.startsWith('/api/notifications'));
