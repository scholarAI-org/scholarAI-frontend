# Contract: Home Section Sources

Applies to every Home section whose backend API is missing or not ready: `notifications`, `activity`, and `recommendations` (the last only if Q1 = B). Sections with an existing API (profile completion, saved, tracked, latest scholarships) call their real clients directly and **never** have a mock.

## Interface

```ts
type HomeSectionId = 'notifications' | 'activity' | 'recommendations';

type HomeSource<T> =
  | { kind: 'real'; load: (signal?: AbortSignal) => Promise<T> }
  | { kind: 'mock'; load: (signal?: AbortSignal) => Promise<T> }
  | { kind: 'unavailable' };

interface HomeSources {
  notifications: HomeSource<UnreadNotifications>; // { unreadCount: number }
  activity: HomeSource<ActivityItem[]>; // validated, newest first, ≤ limit
  recommendations: HomeSource<RecommendationCard[]>; // not wired in the UI today (Q1 uses the discovery list)
}

function createHomeSources(input: { mockSections: readonly HomeSectionId[] }): HomeSources;
```

## Invariants

1. **Same output type**: `real.load` and `mock.load` resolve to the same validated `T`. Both pass raw payloads through the same zod schema (`home/schemas/*`). A schema failure rejects with `HomeContractError`.
2. **Selection order** per section: `real` if `HOME_API_AVAILABILITY[section] === true` → else `mock` if `section ∈ mockSections` **and** `process.env.NODE_ENV !== 'production'` → else `unavailable`.
3. **`unavailable` renders nothing**: the section (and the header bell for notifications) is not mounted, and no number or placeholder is shown (FR-017, FR-030).
4. **`mock` is always labeled**: any section whose source kind is `mock` renders `DemoDataBadge` (FR-039).
5. **Mock isolation**: `home/mocks/**` is reachable only through `import('../mocks')` inside `sources/create-home-sources.ts`. Nothing else in `src/` references it.
6. **Server-side gate**: `mockSections` comes only from `resolveHomeMockSections(process.env)`, evaluated in Server Components. It is `[]` when `NODE_ENV === 'production'`, when `VERCEL_ENV ∈ {production, preview}`, or when `HOME_MOCK_SECTIONS` is unset or blank. Unknown names are dropped.
7. **Cache separation**: source query keys end with the source `kind`, so mock data can never be served from cache once `real` is active.

## `HOME_MOCK_SECTIONS`

- Server-only environment variable (never `NEXT_PUBLIC_`).
- Format: a comma-separated list of section ids, case-insensitive, whitespace-tolerant. Example: `HOME_MOCK_SECTIONS=notifications,activity`.
- Default: unset (off). It must stay unset in every committed `.env*` file and in every Vercel environment.

## Swap procedure (when the backend ships)

1. Confirm the live response matches `requested-backend.openapi.yaml`. If the backend changed the shape, update the schema **and** the mock payload in the same commit.
2. Set `HOME_API_AVAILABILITY[section] = true` in `home/config/home-sections.ts`.
3. Run `pnpm test:student-home`. The contract test parses the mock payload with the updated schema.
4. Tick the section in verification.md's pre-launch checklist.

No component, hook or query code changes.
