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
}

export interface SeededUser {
  id: number;
  email: string;
  password: string;
}

export interface BackendState {
  verified: boolean;
  personal: Record<string, string | null> | null;
  savedIds: number[];
  tracked: { id: number; scholarship_id: number; status: string; notes: string | null }[];
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
