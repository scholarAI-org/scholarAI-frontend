# Clarifications: 009 Student Home

**Status**: OPEN, waiting for product-owner decisions
**Session**: 2026-10-24
**Spec**: [spec.md](./spec.md)

Per the brief, these are recorded as `[NEEDS CLARIFICATION]` and not guessed. Each question has a recommendation so you can reply with letters, for example `Q1: A, Q2: A, Q3: A, Q4: B, Q5: A`. The plan names the **provisional default** it was written against and what changes if you choose differently.

---

## Q1: What should "Latest recommendations" show when profile completion is 70% or higher? (FR-034)

**Why it matters**: The unlocked state has no design, and no personalized recommendations API exists. Whatever we pick decides whether this section shows real, demo or no data in Production.

**Recommended:** Option A. It is the minimal option from the brief: real, published data in an existing component, with no fake personalization. The title must not say "recommended", because nothing is personalized yet.

| Option | Description                                                                                                                                                                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | Reuse the existing scholarship grid card to show the 3 newest published scholarships from the discovery list (sorted newest). The heading reads "Latest scholarships" and there is no match score. "View all" opens search. Swapped to BL-04 when it ships. |
| B      | Show the flagged demo recommendations source (dev only, "Demo data" badge). Hide the section in Preview/Production until BL-04.                                                                                                                             |
| C      | Show a neutral empty state, "Personalized recommendations are coming soon", until BL-04.                                                                                                                                                                    |
| Short  | Your own answer (5 words or fewer)                                                                                                                                                                                                                          |

Not offered: `GET /api/scholarships/recommendations`. It is a public feed of **all** scholarships regardless of status (unpublished and closed included) and returns full description HTML.

---

## Q2: Which URL should Home use, and should a "Home" item be added to the existing sidebar? (FR-002, FR-004)

**Why it matters**: The Figma sidebar shows "Home" as the first, active item, but the current sidebar has no Home entry. The navigation list is shared with the Tracking session's worktree, so a small merge conflict is likely.

**Recommended:** Option A. `/student` is the natural landing page of the student area, and today it is a dead URL.

| Option | Description                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| A      | `/student` (the student area's index). Add one "Home" item at the top of the Discover group. It is active only on `/student`. |
| B      | `/student/home`, with the same "Home" sidebar item.                                                                           |
| C      | `/student`, without a sidebar item (reachable by URL only until a later navigation pass).                                     |
| Short  | Your own answer (5 words or fewer)                                                                                            |

Out of bounds either way: changing the post-login landing (`/student/profile`) means editing auth, so it is recorded as a follow-up.

---

## Q3: Should Home ship behind a server-only feature flag, like Saved (006) and Details (007)? (FR-003)

**Why it matters**: It decides whether merging to `main` makes Home visible in Production immediately.

**Recommended:** Option A. It matches the project's release pattern and lets Home go through a staging check (Gate 2) before students see it.

| Option | Description                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | `STUDENT_HOME_ENABLED`, server-only, default off. Only the literal `"true"` enables it. When off, the route returns "not found" and the sidebar item is hidden. |
| B      | No flag. Home is live on merge.                                                                                                                                 |
| Short  | Your own answer (5 words or fewer)                                                                                                                              |

---

## Q4: What should the header's notification bell and theme toggle do, given that no student notifications API and no theme system exist? (FR-008)

**Why it matters**: Both controls are in the Home design but have nothing behind them. The header is also shared by every student page, so this decides whether other pages change too.

**Recommended:** Option B. It follows the landing page's precedent for the theme button and never shows a bell that leads nowhere. The controls go into the shared header, so every student page stays consistent with the design.

| Option | Description                                                                                                                                                                                                                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | Omit both until they exist. The header stays as it is today, plus the Home greeting.                                                                                                                                                                                                                                          |
| B      | The bell is shown only when a notifications source is active (real, or demo in dev), with an unread dot from the same count as the stat card. The theme toggle is shown **disabled** with the tooltip "Theme switching is currently unavailable" (same as landing). Both are added to the shared header on all student pages. |
| C      | Same as B, but only on Home.                                                                                                                                                                                                                                                                                                  |
| D      | Build a working light/dark theme now (large scope increase; not recommended).                                                                                                                                                                                                                                                 |
| Short  | Your own answer (5 words or fewer)                                                                                                                                                                                                                                                                                            |

---

## Q5: Should tracked scholarships whose application is accepted, rejected or closed count as "upcoming deadlines"? (FR-020)

**Why it matters**: The brief says "union of saved and tracked", but a finished application with a future deadline would show a misleading "11 days left" reminder.

**Recommended:** Option A. It uses the same "finished" definition as the in-progress count and keeps reminders actionable.

| Option | Description                                                                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | Exclude tracked items with status accepted, rejected or closed. If the same scholarship is also saved, it still counts through the saved list. |
| B      | Include all tracked items regardless of status (literal reading of the brief).                                                                 |
| C      | Include only in-progress tracked items **and** exclude `applied` (the deadline no longer matters once applied).                                |
| Short  | Your own answer (5 words or fewer)                                                                                                             |

---

## Deferred (decided by default; tell me if you disagree)

These were not raised as questions (5-question limit, or low impact). The spec records each one as an assumption:

| Topic                                                | Default in spec                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Deadline window and urgency colors                   | 30 days; red 0–7, amber 8–14, green 15–30 (FR-022, FR-024). The Figma sample rows (11/50/196 days) are sample data. |
| Unread-notifications card with no source             | Hidden; the other three cards fill the row (FR-017). The brief allowed "hidden or neutral".                         |
| Notification count 10 (card) vs 2 (sidebar) in Figma | Flagged as a design inconsistency. Any real count uses one source everywhere.                                       |
| Stat cards and deadline rows as links                | Link only when the destination exists and is enabled (FR-018, FR-026).                                              |
| Welcome avatar initials                              | One initial, matching the sidebar and chip (Figma shows two letters).                                               |
| Date digits                                          | Latin digits in Arabic (project rule), not the Arabic-Indic digits in Figma.                                        |
| Recommendations when completion fails to load        | Stays locked (FR-031).                                                                                              |
| Saved count source                                   | The saved list length (visible items only), not `tracked/statistics.saved_scholarships` (includes expired).         |
