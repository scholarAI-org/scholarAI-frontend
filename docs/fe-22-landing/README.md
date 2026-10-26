# FE-22 landing cleanup: verification screenshots

Full-page captures of `/en` and `/ar` at 390, 1024 and 1440 px, taken from `next dev` with
headless Edge via Playwright after the final commit of the branch.

What the landing no longer shows: the hero stat and acceptance cards, featured scholarships,
the "Why PsScholar?" overview, the "12,000 scholarships" bullet, match scores, AI document
improvement, side-by-side compare, the admin dashboard link and the generic LinkedIn/GitHub links.

Measured per capture (all passed): no horizontal scroll; no known fake or unbacked strings in
the visible text; the features grid's last row is centered; no CTA copy overlaps the photo and no
CTA text is clipped. Interactions checked in both locales: nav and footer anchors scroll to their
section, hero "How it works", hero search and quick filters route to
`/student/scholarships?search=...`, the CTA links, the language switch and the mobile menu.

The locale wrapper sets `dir`; the root `<html dir="rtl">` is hardcoded and was left untouched.
