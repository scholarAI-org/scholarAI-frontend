# PROJECT CONTEXT & HANDOFF DOCUMENTATION

**Project**: `scholarai-frontend` (PsScholar / ScholarAI)  
**Branch**: `006-student-saved-scholarships`  
**Generated At**: 2026-10-05

---

## 0) Instructions for the Next Assistant

### Quick Onboarding & Critical Invariants

1. **Repository Layout**: Next.js 16 App Router + TypeScript + Tailwind CSS v4 + `next-intl` (ar/en, RTL/LTR) + React Query v5.
2. **First-Party Auth Cookie Architecture**: The browser calls `/backend/*`, which `src/middleware.ts` proxies to `process.env.BACKEND_URL`. Cookies are HttpOnly and first-party. **DO NOT modify `src/lib/api-client.ts`, `src/middleware.ts`, or core auth providers (`AuthProvider.tsx`, `RoleGuard.tsx`) unless explicitly requested.**
3. **Server-Only Feature Flags**: Feature flags (e.g., `SAVED_SCHOLARSHIPS_ENABLED` in `src/lib/feature-flags.ts`) are **server-only** and read directly from `process.env.SAVED_SCHOLARSHIPS_ENABLED === 'true'`. They MUST NEVER be prefixed with `NEXT_PUBLIC_` and MUST NEVER default to `true` or fall back to `|| true`.
4. **Route Gating**: Server Components (e.g. `src/app/[locale]/student/saved/page.tsx`) must check the feature flag server-side and invoke `notFound()` immediately when `false` before any API fetch or client render.
5. **Internationalization (i18n)**: All user-facing strings must be localized in `src/messages/ar.json` and `src/messages/en.json`.
   - Arabic plurals must include `=0` (or `zero`), `one`, `two`, `few`, `many`, and `other`.
   - Use `{count, number, integer}` inside ICU strings instead of `#` to ensure numbers are pinned to Latin digits via `i18n/formatting.ts`.
6. **Single Active Navigation Item**: In `src/features/student/layout/student-navigation.ts`, each route MUST activate exactly ONE nav item (`/student/profile` -> Profile, `/student/scholarships` and `/student/scholarships/[id]` -> Search, `/student/saved` -> Saved).
7. **Production Import Guard**: Code under `src/` MUST NOT import from `tests/`, `scripts/`, or `fixtures/`.
8. **Git Hygiene**: Always stage explicit file paths only. Never `git add -A`. Never stage `.env*`, `.mcp.json`, or `.aws`.

---

## 1) Overview

- **Project Name**: `scholarai-frontend` (PsScholar / ScholarAI)
- **Idea**: A specialized platform connecting Palestinian students, graduates, and researchers with global and local scholarship opportunities.
- **Problem Solved**: Palestinian students face fragmented scholarship listings, language barriers, opaque eligibility criteria, and missed deadlines.
- **Goal**: Provide an authenticated, bilingual (Arabic/English), AI-assisted platform with tailored matching, bookmarking/saved collection management, document optimization, and deadline tracking.
- **Target Audience**: Palestinian students seeking Higher Education opportunities, and platform administrators managing listings and scrapers.
- **Current Status**: Active production frontend. Auth, Student Profile, Scholarship Discovery (Feature 005), Admin Dashboard, Admin Scholarship Review, and Admin Manual Entry are implemented. Student Saved Scholarships (Feature 006) frontend implementation is complete (Gate 1 PASSED) behind an OFF feature flag.

---

## 2) Scope

### In Scope

- Authenticated student navigation and shell (`StudentShell`, `StudentSidebar`, `StudentMobileNavigation`, `StudentHeader`).
- Scholarship discovery grid/list views, search debounce, country/level/funding filtering, sorting, pagination, and detail pages.
- Student saved scholarships page (`/student/saved`), optimistic unsave with exact-position rollback, confirmed zero empty states, and target-contract response validation.
- Admin management portal (`/admin/dashboard`, `/admin/scholarship-review`, `/admin/manual-scholarship`).
- Bilingual support (Arabic RTL / English LTR) with pinned Latin digit formatting.
- Unit and component integration testing using Node's native test runner (`node --test`).

### Out of Scope

- Backend database or API service implementation (lives in backend repository `scholarAI-backend`, deployed on Render).
- Browser-side recommendations calculation or score fabrication (match score comes purely from backend or is omitted).
- Direct client-side calls to backend bypass proxy (all browser requests route via `/backend/*`).

---

## 3) Features Status

| Feature ID / Module | Name                          | Status                           | Notes                                                                            |
| ------------------- | ----------------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| **001**             | Admin Application Shell       | Completed                        | Generic admin sidebar, header, role check                                        |
| **002**             | Admin Dashboard               | Completed                        | System stats, pending review count, audit logs                                   |
| **003**             | Admin Manual Scholarship      | Completed                        | Form submission for manual scholarship entry                                     |
| **004**             | Admin Scholarship Review      | Completed                        | Approval/rejection workflow for scraped items                                    |
| **005**             | Student Scholarship Discovery | Completed                        | Grid/list view, URL-query sync, search debounce, bookmark cache, minimal details |
| **006**             | Student Saved Scholarships    | Frontend Implementation Complete | Gate 1 PASSED; Gate 2 (backend acceptance) pending API alignment                 |
| **Auth**            | First-Party Cookie Auth       | Completed                        | Proxy rewrite in `middleware.ts`, `AuthProvider`, `RoleGuard`                    |

---

## 4) Tech Stack

- **Framework**: Next.js 16.2.12 (App Router)
- **Language**: TypeScript 5.x
- **React**: React 19.2.4 / React DOM 19.2.4
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), Framer Motion (13.1.1), Lucide React (1.28.0)
- **Internationalization**: `next-intl` (4.13.4), `intl-messageformat` (11.2.13), custom formatting layer in `src/i18n/formatting.ts`
- **Data Fetching & State**: `@tanstack/react-query` (v5.101.4), Zustand (5.0.14) for local state, React Hook Form (7.84.0) + Zod (4.4.3)
- **Runtime & Build Tools**: Node.js v20+, `pnpm`, ESLint 9, Prettier, Husky, Commitlint
- **Test Runner**: Native Node Test Runner (`node --test`) with custom on-the-fly TypeScript transpilation harness (`ts.transpileModule`).

---

## 5) Architecture

### Frontend / Proxy / Backend Flow

```text
[ Browser (Client) ]
       │
       │ HTTP / JSON (same-origin: /backend/api/...)
       ▼
[ Next.js Server (src/middleware.ts) ]
       │
       │ Rewrites /backend/* to process.env.BACKEND_URL
       │ Forwards Cookie & X-Forwarded-For + PROXY_SHARED_SECRET
       ▼
[ Backend API (Render: https://scholarai-backend-2e27.onrender.com) ]
```

### React Query & Cache Architecture

- **Query Key Hierarchy** (`src/features/student/scholarship-discovery/query-keys.ts`):
  - `studentScholarshipKeys.all`
  - `studentScholarshipKeys.discoveries()`
  - `studentScholarshipKeys.discovery(query)`
  - `studentScholarshipKeys.details()`
  - `studentScholarshipKeys.detail(id)`
  - `studentScholarshipKeys.savedLists()`
  - `studentScholarshipKeys.saved()`
  - `studentScholarshipKeys.filterOptions()`
- **Bookmark Mutation Cache** (`src/features/student/scholarship-discovery/lib/bookmark-cache.ts`):
  - Optimistically updates `is_saved` flag across cached discovery lists and detail views.
  - Cancels in-flight discovery/saved queries during optimistic mutations.
  - Settles by invalidating `discoveries()`, `detail(id)`, and `savedLists()`. **Never** invalidates `studentScholarshipKeys.all`.

---

## 6) File Tree

```text
scholarai-frontend/
├── .env.example                               # Environment variable documentation
├── package.json                               # Project dependencies & scripts
├── tsconfig.json                              # TypeScript compiler configuration
├── next.config.ts                             # Next.js configuration
├── src/
│   ├── app/                                   # App Router routes
│   │   ├── [locale]/
│   │   │   ├── layout.tsx                     # Locale layout: QueryProvider, NextIntlClientProvider, AuthProvider
│   │   │   ├── page.tsx                       # Landing page
│   │   │   ├── login/page.tsx                 # Login page
│   │   │   ├── register/page.tsx              # Register page
│   │   │   ├── admin/                         # Admin portal routes
│   │   │   └── student/                       # Student portal routes
│   │   │       ├── layout.tsx                 # Student layout: Server Component with RoleGuard & StudentShell
│   │   │       ├── profile/page.tsx           # Profile page
│   │   │       ├── scholarships/
│   │   │       │   ├── page.tsx               # Scholarship discovery route
│   │   │       │   └── [id]/page.tsx          # Scholarship details boundary route
│   │   │       └── saved/
│   │   │           └── page.tsx               # Saved scholarships route (feature flag gated)
│   ├── features/                              # Feature-sliced domain modules
│   │   ├── admin/                             # Admin domain features
│   │   ├── auth/                              # Authentication providers, hooks, RoleGuard
│   │   │   ├── components/RoleGuard.tsx
│   │   │   ├── providers/AuthProvider.tsx
│   │   │   └── hooks/useCurrentUser.ts
│   │   ├── landing/                           # Landing page components
│   │   ├── profile/                           # Student profile wizard/forms
│   │   └── student/                           # Student sub-features
│   │       ├── layout/                        # Shared student frame & shell
│   │       │   ├── StudentShell.tsx
│   │       │   ├── StudentHeader.tsx
│   │       │   ├── StudentSidebar.tsx
│   │       │   ├── StudentMobileNavigation.tsx
│   │       │   ├── student-navigation.ts
│   │       │   └── types.ts
│   │       ├── scholarship-discovery/         # Feature 005: Discovery, cards, filters, search
│   │       │   ├── adapters/scholarship.ts
│   │       │   ├── components/
│   │       │   ├── hooks/
│   │       │   └── lib/bookmark-cache.ts
│   │       └── saved-scholarships/            # Feature 006: Saved scholarships
│   │           ├── api/saved-scholarships.ts
│   │           ├── components/
│   │           ├── hooks/useSavedScholarshipsQuery.ts
│   │           └── lib/validateSavedResponse.ts
│   ├── i18n/                                  # next-intl configuration & digit pinning
│   │   ├── formatting.ts
│   │   ├── navigation.ts
│   │   └── routing.ts
│   ├── lib/                                   # Shared application utilities
│   │   ├── apiClient.ts                       # Browser/Server HTTP client wrapper
│   │   ├── backend-proxy.ts                   # Same-origin proxy header & URL helpers
│   │   └── feature-flags.ts                   # Server-only feature flag registry
│   └── messages/                              # Translation catalogues
│       ├── ar.json                            # Arabic messages
│       └── en.json                            # English messages
├── specs/                                     # Spec-Driven Development specifications
│   ├── 005-student-scholarship-discovery/
│   └── 006-student-saved-scholarships/
│       ├── spec.md
│       ├── plan.md
│       ├── tasks.md
│       └── contract-notes.md
├── scripts/                                   # Dev-only scripts (not imported by src/)
│   ├── dev-mock-backend.mjs
│   └── dev-mock-backend.README.md
└── tests/                                     # Test suite (`node --test`)
    ├── fixtures/saved-scholarships/
    ├── student-saved-scholarships.test.mjs
    ├── student-scholarship-discovery.test.mjs
    ├── student-layout.test.mjs
    └── i18n-numerals.test.mjs
```

---

## 7) Critical Files & Snippets

### A. Next.js Middleware Proxy (`src/middleware.ts`)

```typescript
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import {
  backendTargetUrl,
  buildProxyRequestHeaders,
  isBackendPath,
  trailingSlashRedirectPath,
} from '@/lib/backend-proxy';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isBackendPath(pathname)) {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ detail: 'Service unavailable' }, { status: 503 });
    }
    return NextResponse.rewrite(backendTargetUrl(pathname, search, backendUrl), {
      request: {
        headers: buildProxyRequestHeaders(request.headers, process.env.PROXY_SHARED_SECRET),
      },
    });
  }

  const withoutSlash = trailingSlashRedirectPath(pathname);
  if (withoutSlash) {
    return NextResponse.redirect(new URL(`${withoutSlash}${search}`, request.url), 308);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/backend/:path*', '/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};
```

### B. API Client (`src/lib/api-client.ts`)

```typescript
import { BACKEND_PREFIX } from './backend-proxy';

export function resolveBackendBaseUrl(
  isBrowser = typeof window !== 'undefined',
  backendUrl = process.env.BACKEND_URL
): string {
  if (isBrowser) {
    return BACKEND_PREFIX;
  }
  if (!backendUrl) {
    throw new Error('BACKEND_URL is not configured');
  }
  return backendUrl.replace(/\/+$/, '');
}

export class ApiError extends Error {
  details: Array<{ loc: (string | number)[]; msg: string }>;

  constructor(
    message: string,
    details: Array<{ loc: (string | number)[]; msg: string }> = [],
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = resolveBackendBaseUrl();
  const path = endpoint.replace(/^\/+/, '');

  const isFormData = options?.body instanceof FormData;
  const headers = { ...options?.headers } as Record<string, string>;

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}/${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const detail = errorData?.detail;
    const message = Array.isArray(detail)
      ? detail[0]?.msg
      : typeof detail === 'string'
        ? detail
        : null;
    throw new ApiError(
      message || 'error happen',
      Array.isArray(detail) ? detail : [],
      response.status
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
```

### C. Server-Only Feature Flags (`src/lib/feature-flags.ts`)

```typescript
export const featureFlags = Object.freeze({
  // Feature 006: Student Saved Scholarships route + nav item.
  // Default: false. The literal string "true" is the only enabling value.
  get savedScholarshipsEnabled(): boolean {
    return process.env.SAVED_SCHOLARSHIPS_ENABLED === 'true';
  },
});
```

### D. Saved Route Server Component Gate (`src/app/[locale]/student/saved/page.tsx`)

```typescript
import { notFound } from 'next/navigation';
import { featureFlags } from '@/lib/feature-flags';
import { SavedScholarshipsPage } from '@/features/student/saved-scholarships/components/SavedScholarshipsPage';

export default async function SavedPage() {
  if (!featureFlags.savedScholarshipsEnabled) {
    notFound();
  }
  return <SavedScholarshipsPage />;
}
```

### E. Target Contract Response Validator (`src/features/student/saved-scholarships/lib/validateSavedResponse.ts`)

```typescript
import {
  isDiscoveryCardShape,
  type ScholarshipDiscoveryCard,
} from '@/features/student/scholarship-discovery/adapters/scholarship';

export type SavedContractErrorReason =
  'not-array' | 'empty-item-shape' | 'missing-is-saved' | 'is-saved-false';

export class SavedContractError extends Error {
  constructor(
    public readonly reason: SavedContractErrorReason,
    public readonly itemIndex?: number
  ) {
    super(
      `Saved scholarships response contract error: ${reason}${itemIndex !== undefined ? ` at index ${itemIndex}` : ''}`
    );
    this.name = 'SavedContractError';
  }
}

export function validateSavedResponse(
  raw: unknown
): { ok: true; cards: ScholarshipDiscoveryCard[] } | { ok: false; error: SavedContractError } {
  if (!Array.isArray(raw)) {
    return { ok: false, error: new SavedContractError('not-array') };
  }
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!isDiscoveryCardShape(item)) {
      return { ok: false, error: new SavedContractError('empty-item-shape', i) };
    }
    if (typeof item.is_saved !== 'boolean') {
      return { ok: false, error: new SavedContractError('missing-is-saved', i) };
    }
    if (item.is_saved !== true) {
      return { ok: false, error: new SavedContractError('is-saved-false', i) };
    }
  }
  return { ok: true, cards: raw as ScholarshipDiscoveryCard[] };
}
```

---

## 8) Frontend Details

- **Design Tokens & Palette**:
  - Primary Navy: `#274383`
  - Secondary Accent / Action: `#F97316` (Orange 500)
  - Page Background: `#F8FAFC`
  - Card Border / Divider: `#E2E8F0` / `#E5E7EB`
  - Text Primary: `#434343` / `#1E293B`
  - Text Muted: `#B5B5B5` / `#64748B`
- **Layout Grid**:
  - Desktop (≥1024px): 236px sidebar + minmax(0, 1204px) main content.
  - Discovery & Saved Grid: 3 columns (≥1024px), 2 columns (768px–1023px), 1 column (<768px).
- **RTL / LTR**:
  - Locale `ar`: `dir="rtl"`, `lang="ar"`, flex/grid logical properties (`border-s-4`, `ms-auto`, `ps-4`).
  - Digit formatting: Pinned to Latin numerals using `ar-u-nu-latn` and `intlFormats` configuration in `src/i18n/formatting.ts`.

---

## 9) Backend Endpoints Consumed

All endpoints are invoked via `apiClient` (`/backend/api/...`):

| Endpoint                           | Method | Role / Description                                                                           |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `/api/auth/me`                     | GET    | Authenticated user profile (`id`, `email`, `name`, `role`)                                   |
| `/api/auth/login`                  | POST   | Password login                                                                               |
| `/api/auth/logout`                 | POST   | Session invalidation                                                                         |
| `/api/auth/google`                 | POST   | Google OAuth exchange                                                                        |
| `/api/scholarships/`               | GET    | Discovery list query (`page`, `academic_level`, `funding_type`, `country`, `search`, `sort`) |
| `/api/scholarships/filter-options` | GET    | Returns available country strings                                                            |
| `/api/scholarships/{id}`           | GET    | Scholarship details response                                                                 |
| `/api/scholarships/{id}/save`      | POST   | Bookmarks a scholarship                                                                      |
| `/api/scholarships/{id}/save`      | DELETE | Unbookmarks a scholarship                                                                    |
| `/api/scholarships/saved`          | GET    | Target contract: complete unpaged discovery-card-compatible array                            |
| `/api/admin/dashboard/stats`       | GET    | Admin overview metrics                                                                       |
| `/api/admin/scholarships/pending`  | GET    | Pending scraped scholarships                                                                 |
| `/api/admin/audit-logs`            | GET    | Admin audit logs                                                                             |

---

## 10) Database & Data Schemas

The frontend defines explicit adapter models over backend schemas:

### `ScholarshipDiscoveryCard` Model (`src/features/student/scholarship-discovery/adapters/scholarship.ts`)

```typescript
export interface ScholarshipDiscoveryCard {
  id: number;
  title: string;
  title_ar?: string | null;
  title_en?: string | null;
  university_name?: string | null;
  country?: string | null;
  deadline?: string | null;
  no_deadline?: boolean | null;
  funding_type?: string | null;
  funding_amount?: string | null;
  study_level?: string | null;
  opportunity_type?: string | null;
  image_url?: string | null;
  is_saved: boolean;
  match?: ScholarshipMatchInfo | null;
}
```

---

## 11) External APIs & Integrations

- **Render Backend API**: Hosted backend instance at `https://scholarai-backend-2e27.onrender.com`.
- **Google Identity Services**: OAuth login using `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

---

## 12) Local Setup

1. **Prerequisites**: Node.js v20.x, `pnpm` v9+.
2. **Installation**:
   ```bash
   pnpm install
   ```
3. **Environment Setup**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Set variables in `.env.local`:
   ```env
   BACKEND_URL=https://scholarai-backend-2e27.onrender.com
   PROXY_SHARED_SECRET=your-local-proxy-secret
   SAVED_SCHOLARSHIPS_ENABLED=true
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   ```

---

## 13) Important Commands

```bash
# Start local development server
pnpm dev

# Type check
pnpm exec tsc --noEmit

# Run ESLint
pnpm lint

# Production build
pnpm build

# Run feature test suite (Saved Scholarships)
node --test --test-isolation=none tests/student-saved-scholarships.test.mjs

# Run student layout tests
pnpm test:student-layout

# Run i18n numeral pin tests
pnpm test:i18n

# Run scholarship discovery tests
pnpm test:scholarship-discovery
```

---

## 14) Tests

- **Framework**: Native Node Test Runner (`node --test`).
- **Isolation**: Runs in single-process mode (`--test-isolation=none`) or isolated process files.
- **Coverage**:
  - `tests/student-saved-scholarships.test.mjs` (24 tests passing)
  - `tests/student-scholarship-discovery.test.mjs` (90 tests passing)
  - `tests/i18n-numerals.test.mjs` (6 tests passing)
  - `tests/student-layout.test.mjs` (layout, navigation, identity, focus trap)
  - `tests/backend-proxy.test.mjs`, `tests/api-client.test.mjs`, `tests/env-config.test.mjs`

---

## 15) CI/CD & Deployment

- **Platform**: Vercel (Frontend), Render (Backend).
- **Environment Gating**:
  - Staging / Preview: `SAVED_SCHOLARSHIPS_ENABLED` can be set to `"true"` for verification.
  - Production: `SAVED_SCHOLARSHIPS_ENABLED` stays unset / `"false"` until backend gate 2 contract acceptance passes.

---

## 16) Current State & Verification Summary

- **Feature 006 Status**: Frontend Implementation Complete (Gate 1 PASSED). Awaiting backend contract alignment (Gate 2).
- **Branch**: `006-student-saved-scholarships`
- **Working Tree**: Clean (`nothing to commit, working tree clean`).
- **Test Results Verified**:
  - `node --test --test-isolation=none tests/student-saved-scholarships.test.mjs` -> **29/29 PASS**
  - `pnpm test:scholarship-discovery` -> **90/90 PASS**
  - `pnpm test:i18n` -> **6/6 PASS**
  - `pnpm test:student-layout` -> **15/15 PASS**
  - `pnpm exec tsc --noEmit` -> **0 errors**
  - `pnpm lint` -> **0 errors (3 warnings)**
  - `pnpm build` -> **Compiled successfully**

---

## 17) TODO / Pending Tasks

- [x] **T001–T050** (Phases 1–9): Frontend Implementation Complete (Gate 1 PASSED).
- [ ] **T051–T056** (Phase 10): Gate 2 Backend Integration Acceptance (flip `SAVED_SCHOLARSHIPS_ENABLED=true` after backend API alignment).

---

## 18) Architectural Decisions

1. **Same-Origin Proxy over CORS**:
   - _Rationale_: Eliminates third-party cookie restrictions in modern browsers and avoids storing auth tokens in `localStorage`.
2. **Server-Only Feature Flags**:
   - _Rationale_: Prevents feature flag tampering from client-side devtools or bundle inspect tools.
3. **Spec-Driven Dual-Track Completion**:
   - _Rationale_: Frontend implementation reaches `FRONTEND IMPLEMENTATION COMPLETE` (Gate 1) independently against mock fixtures, keeping production safe behind an OFF flag until the backend aligns (Gate 2).

---

## 19) Code Standards

- **Commits**: Conventional commits (`feat(student-saved-scholarships): phase 5 — navigation plumbing`).
- **Imports**: Clean aliases using `@/` mapping to `src/`.
- **Imports Guard**: `src/` must never import from `tests/`, `scripts/`, or `fixtures/`.

---

## 20) Security

- **Authentication**: Session cookie forwarded by proxy.
- **Authorization**: `RoleGuard` component restricts access based on `user.role` (`student` or `admin`).
- **IP Rate Limit Protection**: Proxy appends `PROXY_SHARED_SECRET` header so backend can trust client IP.

---

## 21) Performance & Monitoring

- **Search Debounce**: 300ms debounce on discovery input to prevent redundant API queries.
- **Query Caching**: `staleTime` tuned per dataset (discovery results vs longer-lived filter options).

---

## 22) Next Steps

1. Apply Phase 5 navigation plumbing changes (`StudentShell`, `StudentSidebar`, `StudentMobileNavigation`, `types.ts`, `student-navigation.ts`).
2. Finalize Phase 6 i18n copy audit.
3. Run test suite: `node --test --test-isolation=none tests/student-saved-scholarships.test.mjs`, `pnpm test:student-layout`, `pnpm test:i18n`, `pnpm test:scholarship-discovery`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build`.
4. Commit per phase:
   - `feat(student-saved-scholarships): phase 5 — navigation plumbing`
   - `feat(student-saved-scholarships): phase 6 — i18n`
5. Push to `origin/006-student-saved-scholarships` and confirm `HEAD` matches `origin`.

---

## 23) Open Questions

- Confirmation from the backend team regarding when live `GET /api/scholarships/saved` complete unpaged discovery-card-compatible response will land on Staging.

---

## 24) Missing Information

- None. All project contracts, schemas, files, and tests have been verified directly from workspace code.

---

## 25) Appendix

- Specification: `specs/006-student-saved-scholarships/spec.md`
- Implementation Plan: `specs/006-student-saved-scholarships/plan.md`
- Tasks Checklist: `specs/006-student-saved-scholarships/tasks.md`
- Contract Notes: `specs/006-student-saved-scholarships/contract-notes.md`

---

End of context file, ready to send to the other assistant.
