# FE-22 landing cleanup: verification screenshots

Full-page captures of `/en` and `/ar` at 390, 1024 and 1440 px after removing fake content
(hero stat cards, acceptance card, featured scholarships, "Why PsScholar?" overview, 12,000
bullet, 92% illustration). Captured from `next dev` with headless Edge via Playwright.

Checked per capture: no horizontal scroll, no known fake strings in the visible text, every
in-page anchor resolves to a section. The locale wrapper sets `dir` (the root `<html>` is
hardcoded `rtl`; that predates this change).
