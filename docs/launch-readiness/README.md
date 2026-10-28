# Launch-readiness verification

Captured from a production build (`pnpm build && pnpm start`) with
`SITE_URL=https://scholarai.example`, driven with Playwright at 1280×900.

| File                                   | What it shows                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `not-found-en.png`, `not-found-ar.png` | `/{locale}/this-page-does-not-exist` — the localized 404, HTTP 404                                                        |
| `error-en.png`, `error-ar.png`         | the error boundary, forced by a temporary route that threw; HTTP 500. The route was removed again                         |
| `flag-off-student-en.png`              | `/en/student` with `STUDENT_HOME_ENABLED` unset                                                                           |
| `landing-en.png`, `landing-ar.png`     | the public landing page in both locales                                                                                   |
| `head-dump.txt`                        | `<title>`, description, canonical, hreflang, Open Graph, Twitter and icon tags for `/ar`, `/en`, `/ar/login`, `/en/login` |
| `http-status.json`                     | the status code each checked URL returned                                                                                 |

`robots.txt`, `sitemap.xml`, `manifest.webmanifest` and the `X-Robots-Tag`
header on `/{locale}/student` and `/{locale}/admin` were checked against the
same server; `tests/launch-readiness.test.mjs` asserts the objects they are
generated from.

## Known, pre-existing

`/{locale}/student` with the Student Home flag off answers **HTTP 200** and
renders the student shell's "verifying session" state rather than the 404 page:
the shell's client-side `RoleGuard` streams first, so the page's `notFound()`
can no longer change the status. Verified to behave identically with these
changes reverted, so it belongs to the student shell, not to this work. The
route is `Disallow`ed in robots.txt and served `X-Robots-Tag: noindex`, so
nothing reaches a search index either way.
