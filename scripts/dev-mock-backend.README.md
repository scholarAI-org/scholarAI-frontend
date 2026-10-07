# Dev-only mock backend

Serves the Feature 006 TARGET contract for the Student Saved Scholarships
feature plus a >20-item discovery dataset so pagination can be exercised
locally. **Dev only.** Not imported by anything under `src/`; the production
import guard (`tests/student-saved-scholarships.test.mjs`) enforces that
`src/` never references `scripts/` or `tests/`.

## Run

```sh
node scripts/dev-mock-backend.mjs
# → listening on http://127.0.0.1:4100  scenario=populated
```

The port defaults to `4100`. Override with `PORT=5000 node scripts/dev-mock-backend.mjs`.

## Point the app at it

Add these two lines to `.env.local` **temporarily**, then run `pnpm dev`:

```env
BACKEND_URL=http://127.0.0.1:4100
SAVED_SCHOLARSHIPS_ENABLED=true
```

Remove them before pushing. `SAVED_SCHOLARSHIPS_ENABLED` must stay unset in
every committed source and every deployed environment until Feature 006
gate 2 (live backend contract acceptance).

## Scenarios

Pass `SCENARIO=<name>` to boot into one, or hit the running server:

```sh
curl -XPOST http://127.0.0.1:4100/__scenario \
  -H 'content-type: application/json' \
  -d '{"scenario":"empty"}'
```

| Scenario              | What the saved endpoint returns                           |
| --------------------- | --------------------------------------------------------- |
| `populated` (default) | 3-item target-contract array                              |
| `empty`               | `[]` — confirmed empty                                    |
| `one-item`            | 1-item array                                              |
| `multi-item`          | 4-item array (includes a no-deadline card)                |
| `unsave-failure`      | 500 on `DELETE /api/scholarships/{id}/save`, 200 on GET   |
| `loading-slow`        | 3s delay before 200                                       |
| `auth-401`            | 401 Not authenticated                                     |
| `forbidden-403`       | 403 Forbidden                                             |
| `server-500`          | 500 Internal error                                        |
| `malformed`           | 200 with an envelope-wrapped payload (contract violation) |
| `nullable-fields`     | 1 card with every optional field as `null`                |

A per-request override is also supported via `?scenario=<name>` on the
request URL — handy for exercising discovery and saved under different
states without restarting.

## Endpoints served

- `GET /api/scholarships/saved` → `ScholarshipDiscoveryCard[]` with
  `is_saved=true` (target contract).
- `GET /api/scholarships/` → paginated discovery with ≥ 20 items.
- `GET /api/scholarships/{id}` → details, visibility matching discovery.
- `POST /api/scholarships/{id}/save` / `DELETE /api/scholarships/{id}/save`
  → mimic the real save/unsave semantics; the DELETE honors
  `unsave-failure`.
- `GET /api/me/current` → minimal student session so the shell renders.
- `POST /__scenario` → switch the active scenario without restart.
