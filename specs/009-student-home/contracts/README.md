# Contracts: 009 Student Home

| File                                                               | What it defines                                                                                                                                                                           | Consumers                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [home-section-sources.md](./home-section-sources.md)               | The adapter interface every Home section reads through (`real` / `mock` / `unavailable`), the gating rules, and the swap procedure.                                                       | `src/features/student/home/sources/**`, tests    |
| [requested-backend.openapi.yaml](./requested-backend.openapi.yaml) | OpenAPI 3.1 fragment for the **requested** endpoints (BE-09 notifications and activity, BL-04 recommendations). The Home zod schemas and the mock payloads are written against this file. | backend team, `home/schemas/**`, `home/mocks/**` |

Existing endpoints that Home consumes unchanged (`/auth/me`, `/profile`, `/api/scholarships/saved`, `/api/scholarships/tracked`, `/api/scholarships/`) are documented in `docs/api/openapi.json`. [../contract-notes.md](../contract-notes.md) maps them to UI fields.
