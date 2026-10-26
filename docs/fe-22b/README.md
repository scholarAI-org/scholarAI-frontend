# FE-22b landing claims: verification screenshots

Full-page captures of `/en` and `/ar` at 390, 1024 and 1440 px, taken from a production build
(`next build` + `next start`) with headless Chromium via Playwright after the final commit of the
branch.

What the landing no longer claims: AI recommendations (the feature card, the "smart
recommendations" section and the how-it-works step that fed it), instant notifications, deadline
reminders, an AI assistant in the CTA, and an "AI-powered platform" hero badge. Every one of these
reads through an API that `src/features/student/home/config/home-sections.ts` marks unavailable, or
through no code at all. The footer links that pointed at the removed section and at notifications
are gone with them.

Measured per capture (all six passed): no horizontal scroll (`scrollWidth == clientWidth`); no
banned en or ar string in the rendered text; no clipped text, including the English hero search
placeholder, which used to be cut off in the 1024 hero column; four feature cards laid out 4 / 2+2 /
1 per row at 1440 / 1024 / 390 and three steps laid out 3 / 3 / 1, so no row ends with a lone card;
no console or page errors. Interactions checked in both locales: the three nav anchors scroll their
section to the top of the viewport, every footer link resolves to a real route (200), and the hero
search routes to `/student/scholarships?search=...`.

The locale wrapper sets `dir`; the root `<html dir="rtl">` is hardcoded and was left untouched.
