# FE-14 mobile shell: verification

Captures of the student area from a production build (`pnpm build && pnpm start`) against
`scripts/dev-mock-backend.mjs`, with headless Chromium via Playwright, after the last commit
of `feat/fe-14-mobile-shell`.

`next dev` could not be used: its HMR client fails to open its WebSocket in this sandbox and
the page never hydrates. The production build is the closer target anyway.

## What is in here

| Files                                                           | What they show                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `{ar,en}-390-{home,search,saved,tracking,profile}-flags-on.png` | 390px with `STUDENT_HOME_ENABLED`, `SAVED_SCHOLARSHIPS_ENABLED`, `TRACKING_ENABLED` and `SCHOLARSHIP_DETAILS_ENABLED` all `true` |
| `{ar,en}-390-…-flags-off.png`                                   | the same routes with every flag unset                                                                                            |
| `{ar,en}-1440-…-flags-{on,off}.png`                             | the desktop regression check                                                                                                     |
| `{ar,en}-390-account-menu.png`                                  | the account menu open                                                                                                            |
| `{ar,en}-390-tab-focus.png`                                     | the keyboard focus ring on a tab                                                                                                 |

With the flags off, `/student`, `/student/saved` and `/student/tracking` are 404s — that is the
existing route gating, not the shell.

## Measured, all passing

- **No horizontal scroll** on any of the 20 captures (`documentElement.scrollWidth` equals
  `clientWidth`). Arabic `/student/profile` did scroll sideways at 390 (417px against 390)
  **on `main` as well**; the profile `Stepper` now scrolls inside itself below `sm`.
- **Tab count follows the flags**: 5 tabs with every flag on, 2 (Search, Profile) with them
  all off, in both locales, with no empty slots.
- **`aria-current="page"`** on exactly one tab per route, and it follows a tap
  (`/student/scholarships` → tap Saved → `/student/saved`, current moves with it).
- **Touch targets**: every tab is 78x53 px at 390; nothing in the bar is under 44x44.
- **Direction**: Arabic runs Home → Profile right to left, English left to right. Both read
  from logical properties only; no `rtl:` variant is used in the new code.
- **Focus**: `solid 2px rgb(249, 115, 22)` at `-2px` offset on a keyboard-focused tab.
  (Read it after the `transition-colors` has settled — mid-transition it still reports the
  text colour.)
- **Account menu**: opens from the avatar, holds the name, the role and logout, closes on
  Escape with focus returning to the trigger, and stays inside the viewport in both locales.
- **Content clears the bar**: `main` carries
  `padding-bottom: calc(5rem + env(safe-area-inset-bottom))` below `sm` (80px measured), and
  scrolled to the end the last content box ends above the bar's top edge.
- **Desktop unchanged**: 40 captures at 1440, 1024, 768 and 640 px taken from `main` and from
  this branch; 35 are byte-identical. The 5 that differ are all `/student/saved`, by 13–20
  pixels out of ~800,000 (0.002%) in one band. Capturing this branch twice reproduces the same
  noise, so it is that page's own render timing, not a layout change.

## Reproducing

```sh
node scripts/dev-mock-backend.mjs          # 127.0.0.1:4100
cat > .env.local <<'ENV'
BACKEND_URL=http://127.0.0.1:4100
SAVED_SCHOLARSHIPS_ENABLED=true
TRACKING_ENABLED=true
STUDENT_HOME_ENABLED=true
SCHOLARSHIP_DETAILS_ENABLED=true
ENV
pnpm build && pnpm start
```

The flags must stay unset in every committed source and deployed environment.
