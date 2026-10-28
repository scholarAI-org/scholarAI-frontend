# Browser verification: 008 Application tracking

Run on 2026-10-26 against the code on `feat/008b-tracking-finish`. Screenshots are in [screenshots/](./screenshots/); the raw pass/fail list is [screenshots/verification-results.json](./screenshots/verification-results.json).

## How it was run

- App: `next dev` on port 3100 with `TRACKING_ENABLED=true`, `SAVED_SCHOLARSHIPS_ENABLED=true`, `SCHOLARSHIP_DETAILS_ENABLED=true`.
- Browser: Microsoft Edge (Chromium), driven by Playwright, headless.
- Backend: a **fake backend** (outside the repo) that follows `docs/api/openapi.json` for `/tracked`, `/saved` and the discovery endpoints. It can be switched to: slow, empty, 500, 401/403, malformed, all/some unreadable rows, mutation 500 and 404, `official_url` present. It is not the staging backend.
- Widths: 390, 1024 and 1440. Languages: `ar` and `en`.

## Result

**217 automated browser checks, 217 passed** on the final run (including the rows below). Two defects were found and fixed along the way, both by the browser and not by the unit tests:

| Defect found                                                                                                              | Fix                                                                    |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Loading/failed status cards had no `w-full` and shrank to different widths (visible at 390).                              | Placeholder cards fill their grid cell.                                |
| Arabic meta line reversed ISO dates (`2026-01-15` showed as `15-01-2026`) and could reorder an English organization name. | Dates and the organization are isolated with `<bdi>`; tests assert it. |
| Tab left the remove dialog for the browser UI instead of wrapping.                                                        | Same wrapping focus trap the mobile navigation uses.                   |
| Long titles pushed the trash icon onto its own row at 1440.                                                               | Actions stay on one row from `sm` up; the title wraps instead.         |

## What was checked

| Area                | Checked                                                                                                                                                                                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout and overflow | No horizontal scroll in every state at 390 / 1024 / 1440, ar and en (list, loading, empty, error, note editor, dialog).                                                                                                                                                                               |
| RTL / LTR           | In `ar` the title is on the right and the controls on the left, `saved` is the rightmost card, and the control order is select, pill, trash from the right (Figma: trash, pill, select from the left). `en` mirrors it.                                                                               |
| States              | Loading placeholders with no zero counts. Empty with the discovery CTA. Tracked-list error with retry that recovers. Saved-list error leaves the list intact and only the saved card unavailable. All-unreadable rows is an error, not "empty". Some unreadable rows keep the list and show a notice. |
| Filter              | Cards are buttons with `aria-pressed`. Click, Enter and Space toggle. A second tap clears. Another card switches. An empty status shows the empty-filter message. "Show all" clears. The saved card links to `/student/saved`.                                                                        |
| Note editor         | Opens inline, counts code points, over 2000 disables Save and shows an alert, save updates the card and the backend, a failed save keeps the draft and shows an error, Cancel keeps the old note.                                                                                                     |
| Status change       | Card and counts update at once. A 500 rolls back and shows a notice. A 404 drops the row and says it is gone.                                                                                                                                                                                         |
| Remove              | Modal dialog, focus moves inside, Tab wraps, Escape closes and returns focus to the trash button, nothing is deleted by Escape. A failed delete restores the row in the same position with a notice. A successful delete removes it.                                                                  |
| Official link       | Shown only when the backend sends `official_url`, opens in a new tab with `noopener`, hidden otherwise.                                                                                                                                                                                               |
| Sidebar gating      | Flag off: no item (desktop and mobile drawer), `/student/tracking` is 404, no `/tracked` request. Flag on: item and page appear.                                                                                                                                                                      |

Keyboard order on the page (en, 1440): language switch, the saved card (link), the six status cards (buttons), then for each tracking card: status select, scholarship link, stop tracking, edit note.

## Deviations from the Figma (node 2415:4656)

| #   | Deviation                                                                                                                                                                                                                                     | Status                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1   | The external-link icon is not shown (no `official_url` yet, BE-03).                                                                                                                                                                           | By design, pending backend             |
| 2   | Icons are `lucide-react`, not the Figma Hicon set, so shapes differ slightly (the two send icons, the lock, the trash).                                                                                                                       | Open: export the Hicon SVGs if wanted  |
| 3   | Subtitle copy differs from the Figma (no "important dates").                                                                                                                                                                                  | Decided                                |
| 4   | The status dropdown is a native `<select>`. The closed pill matches; the open list is the browser's menu because the Figma has no open state.                                                                                                 | Open: needs a design for the open menu |
| 5   | The note block has an "Edit note / Add note" button and an empty-note line. The Figma shows only the read state. Card height is about 247 px against 235 px.                                                                                  | Added, not in Figma                    |
| 6   | The filter bar, empty filter, notices, loading, empty and error states, and the remove dialog have no Figma. They follow the saved page and the existing dialog patterns.                                                                     | Needs design review                    |
| 7   | Status cards are about 134 px tall against 132 px. At 1024 they are 95 px wide and 2-line labels make them 154 px tall. At 390 they sit in two columns with the last one full width. The Figma only specifies 1440.                           | Accepted                               |
| 8   | The orange "Scholarship" pill is auto-width (Figma 69 px) and appears only when the details flag is on.                                                                                                                                       | Decided                                |
| 9   | Long titles wrap onto two lines; the Figma title never wraps.                                                                                                                                                                                 | Accepted                               |
| 10  | The sidebar and header are the existing shell. The Figma sidebar also lists Home, Improve documents, Notifications and Settings, which do not exist yet. The group label is spelled correctly in Arabic (`الإدارة`); the Figma has `الادارة`. | Out of scope                           |

Pre-existing, not changed here: `<html>` is always `lang="ar" dir="rtl"`; the locale wrapper `<div>` carries the right `lang` and `dir`, so `main` is `ltr` in English (checked), but the document language is still `ar` on English pages. The round "N" in the screenshots is the Next dev indicator.

## Not verified

- Real screen reader (names, roles and live regions were checked as markup and focus order only).
- Safari, Firefox, and real touch devices. Only Edge/Chromium was used.
- Visual pixel comparison against the Figma beyond reading the screenshots side by side.
- The staging backend. Everything above used the fake backend.
