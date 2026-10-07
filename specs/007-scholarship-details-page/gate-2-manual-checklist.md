# Gate 2 Manual Live-Verification Checklist (Feature 007)

**Purpose**: Guide a human operator / QA engineer through live end-to-end verification of Feature 007 (Student Scholarship Details Page) against the deployed backend (Staging or Preview) before final production flag enablement.

---

## 1. Environment & Setup Prerequisites

1. **Environment Configuration**:
   - Set `SCHOLARSHIP_DETAILS_ENABLED=true` in `.env.local` (or preview deployment environment).
   - Ensure `BACKEND_URL` points to the target backend (e.g. `https://scholarai-backend-2e27.onrender.com`).
   - Start the local dev server (`pnpm dev`) or open the target Preview deployment URL.

2. **Test Account Prerequisites**:
   - Active student test account.
   - At least 1 existing scholarship ID available on the backend (e.g. `id=7`).

---

## 2. DevTools Network Tab Baseline Checks

Before executing UI steps, open Chrome/Firefox DevTools (**F12** -> **Network** tab) and filter by `Fetch/XHR` or `/backend/api`:

- [ ] **Cookie Verification**: All requests to `/backend/api/...` include `Cookie: session=...` automatically (first-party HttpOnly cookie).
- [ ] **Exact Endpoint Request**: `GET /backend/api/scholarships/{id}` is fetched with the exact numeric route parameter.
- [ ] **No Authorization Header Leak**: Requests use browser cookies; no `Authorization: Bearer` header is sent by client JS.

---

## 3. Step-by-Step Live Verification Protocol

### Scenario 1: Unflagged Default Guard Check (Flag OFF Verification)

1. Unset `SCHOLARSHIP_DETAILS_ENABLED` (or set to `"false"`).
2. Log in as a student and navigate to `/student/scholarships`.
3. **Assert**: Scholarship card titles and "Details" buttons do NOT render clickable links to `/student/scholarships/[id]`.
4. Manually enter `/[locale]/student/scholarships/7` in the browser address bar.
5. **Assert**: Next.js renders the standard `notFound()` **404 page**. No fetch call is dispatched to `/api/scholarships/7`.

---

### Scenario 2: Flag ON — Navigation & Details Route Load

1. Set `SCHOLARSHIP_DETAILS_ENABLED=true` and restart dev server / reload page.
2. Log in as a student and navigate to `/student/scholarships`.
3. **Assert**: Cards display clickable titles and orange "Details" CTA buttons.
4. Click "Details" / Title on a card with `id=7`.
5. **Assert**:
   - Address bar changes to `/[locale]/student/scholarships/7`.
   - Sidebar navigation highlights "Search" / "البحث عن المنح" as the **single active nav item**.
   - Page header displays full scholarship title and hero banner.
   - DevTools Network tab records `GET /backend/api/scholarships/7` returning HTTP `200 OK`.

---

### Scenario 3: Factual Facts Grid & Component Layout Verification

1. On `/student/scholarships/7`, inspect the rendered UI.
2. **Assert**:
   - **Hero Banner**: Image, title, deadline pill, study level pill, and funding pill render correctly.
   - **Facts Grid**: 8 factual fields (Opening Date, Deadline, Country, University, Funding Amount, Language Requirements, Ingestion Type, Source Link) display accurate data.
   - **Majors List**: Rendered as rounded-full chips (`bg-[#f8fafc]`).
   - **Eligibility Criteria**: Rendered as vertical list with green checkmarks (`#16c172`).
   - **Required Documents**: Rendered as ordered list with numbered badges.
   - **Sidebar Actions Card**: Sticky 449px card on desktop containing "Apply Now" button (`#f97316`), Bookmark pill, and contact links.

---

### Scenario 4: External Links & Accessibility

1. On `/student/scholarships/7`, click the "Apply Now" CTA button or Source Link.
2. **Assert**:
   - Opens in a new browser tab (`target="_blank" rel="noopener noreferrer"`).
   - Screen reader hint `(opens in a new tab)` is present in accessibility tree.
   - Focus outline on Apply Now button uses navy ring (`#274383`).

---

### Scenario 5: Bookmark Interaction on Details Page

1. Click the `ScholarshipBookmark` button in the sidebar actions card.
2. **Assert**:
   - Optimistic update toggles saved state instantly.
   - Network request `POST /backend/api/scholarships/7/save` (or `DELETE`) completes successfully.
   - Navigating back to `/student/saved` reflects the updated bookmark state.

---

### Scenario 6: Invalid Route Parameter Handling

1. Navigate to `/student/scholarships/abc` (non-numeric).
2. Navigate to `/student/scholarships/0` (zero).
3. Navigate to `/student/scholarships/-5` (negative).
4. **Assert**: Next.js renders `notFound()` 404 page for each invalid ID. Zero network requests dispatched to backend.

---

### Scenario 7: Backend 404 / 401 / 403 / 5xx Error States

1. Navigate to `/student/scholarships/99999999` (non-existent ID).
2. **Assert**: Renders localized missing state ("Scholarship not found" / "المنحة غير موجودة").
3. Test 401 / 403 / 5xx simulated responses.
4. **Assert**: Renders localized error banner with accessible live region (`role="alert"`) and retry button for generic errors.

---

## Sign-off

| Role      | Name         | Date           | Environment         | Status  |
| :-------- | :----------- | :------------- | :------------------ | :------ |
| Inspector | Ahmed Zenaty | Pending Gate 2 | Local dev / Staging | Pending |
