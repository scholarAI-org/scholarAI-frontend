# Quickstart: validating Student Notifications

How to prove the feature works end to end once it is implemented. Contract details: [contract-notes.md](./contract-notes.md). Entities: [data-model.md](./data-model.md).

Run commands as `pnpm ...` (or `corepack pnpm ...` when `pnpm` is not on PATH). PowerShell 5.1: no `&&`, use `curl.exe`.

## 1. Checks that need no browser

```text
pnpm lint
pnpm exec tsc --noEmit
pnpm test                          # includes tests/student-notifications*.test.mjs
pnpm test:student-notifications    # only this feature
pnpm build                         # NOTIFICATIONS_ENABLED unset: the route must still build as a gate
```

Expected: all green. The guard tests fail loudly if a backend field name leaks out of `adapter/`, if the flag gains a `NEXT_PUBLIC_` twin, if copy is hard-coded, or if the tab bar stops having five items.

## 2. The browser suite (fake backend, no network)

```text
E2E_REBUILD=1 pnpm test:e2e                      # whole suite, about 3 minutes
pnpm test:e2e notifications.spec.ts              # list, mark, mark all, states, load more, 390px
pnpm test:e2e notifications-count.spec.ts        # badge, bell, Home agreement, polling, stop rules
pnpm test:e2e flags-off.spec.ts                  # 404, nothing visible, zero requests
```

Locally `E2E_BROWSER_CHANNEL=msedge` uses an installed Edge. After changing app code, `E2E_REBUILD=1` forces a rebuild (otherwise the old build is tested).

## 3. Manual walk-through (optional, about 5 minutes)

1. `NOTIFICATIONS_ENABLED=true`, `BACKEND_URL` pointing at the fake backend (`node tests/e2e/fake-backend/server.mjs`, port from `tests/e2e/support/env.ts`), `pnpm dev`.
2. Seed a student with one notification of each type through the fake's control API (`/__e2e/notifications`), sign in, open `/en/student/notifications` and `/ar/student/notifications`.
3. Check: six cards with the right icons and colors; unread ones have the orange border and "New"; the sidebar shows the count; the bell has a dot and links to the page.
4. Click an unread card: it turns read at once and the count drops. Make the fake fail the next PATCH (`/__e2e/notifications/fault`) and click another: it goes back and an alert shows.
5. "Mark all as read": everything reads, the badge disappears.
6. Resize to 390px: the bell is in the top bar, the account menu has a link, the tab bar still has five tabs, the action buttons are full width, nothing scrolls sideways.
7. Unset the flag and restart: `/en/student/notifications` is the localized 404 and the network log has no `/api/notifications` request.

## 4. Launch checklist (kept in `verification.md` when the work is verified)

- [ ] BE-13 endpoints deployed and checked against a real session (open questions in the spec answered).
- [ ] `pnpm test:e2e` green; screenshots in en, ar and at 390px attached to the PR by hand (not committed).
- [ ] `NOTIFICATIONS_ENABLED` set to `true` in the target environment only after the two items above; never in Preview until Production is verified.
- [ ] `SCHOLARSHIP_DETAILS_ENABLED` state noted: with it off the "View" actions are hidden by design.
