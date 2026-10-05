# Gate 2 Manual Live-Verification Checklist (Feature 006)

**Purpose**: Guide a human operator / QA engineer through live end-to-end verification of Feature 006 (Student Saved Scholarships) against the deployed backend (Staging or Preview) before final production flag enablement.

---

## 1. Environment & Setup Prerequisites

1. **Environment Configuration**:
   - Set `SAVED_SCHOLARSHIPS_ENABLED=true` in `.env.local` (or preview deployment environment).
   - Ensure `BACKEND_URL` points to the target backend (e.g. `https://scholarai-backend-2e27.onrender.com`).
   - Start the local dev server (`pnpm dev`) or open the target Preview deployment URL.

2. **Test Account Prerequisites**:
   - One active student test account with **0 saved scholarships** (cleared state).
   - One active student test account with **≥ 1 saved scholarship** (populated state).

---

## 2. DevTools Network Tab Baseline Checks

Before executing UI steps, open Chrome/Firefox DevTools (**F12** -> **Network** tab) and filter by `Fetch/XHR` or `/backend/api`:

- [ ] **Cookie Verification**: All requests to `/backend/api/...` include `Cookie: session=...` automatically (first-party HttpOnly cookie).
- [ ] **No Query String on Saved Endpoint**: `GET /backend/api/scholarships/saved` has **NO** query string parameters (no `?page=`, no `?limit=`).
- [ ] **No Authorization Header Leak**: Requests use browser cookies; no `Authorization: Bearer` header is sent by client JS.

---

## 3. Step-by-Step Live Verification Protocol

### Scenario 1: Unflagged Default Guard Check (Flag OFF Verification)

1. Unset `SAVED_SCHOLARSHIPS_ENABLED` (or set to `"false"`).
2. Log in as a student and navigate to `/student/scholarships`.
3. **Assert**: The navigation sidebar does **NOT** display the "المحفوظات" / "Saved" item.
4. Manually enter `/[locale]/student/saved` in the browser address bar.
5. **Assert**: Next.js renders the standard `notFound()` **404 page**. No fetch call is dispatched to `/api/scholarships/saved`.

---

### Scenario 2: Flag ON — Navigation & Initial Page Load

1. Set `SAVED_SCHOLARSHIPS_ENABLED=true` and restart dev server / reload page.
2. Log in as a student.
3. **Assert**: The sidebar / mobile drawer displays the "المحفوظات" (ar) / "Saved" (en) navigation item under the "اكتشاف" / "Discover" section with the `Bookmark` icon.
4. Click "المحفوظات" / "Saved".
5. **Assert**:
   - Address bar changes to `/[locale]/student/saved`.
   - The "Saved" nav item is highlighted as the **single active nav item**.
   - DevTools Network tab records `GET /backend/api/scholarships/saved` returning HTTP `200 OK`.

---

### Scenario 3: Empty State Verification

1. Log in with a student account that has 0 saved scholarships.
2. Navigate to `/student/saved`.
3. **Assert**:
   - Header title displays "المنح المحفوظة" / "Saved Scholarships".
   - Subheader count displays "لا توجد منح محفوظة" / "No saved scholarships".
   - Central illustration (`200x200`) and localized body text render properly.
   - Click "استكشاف المنح" / "Explore scholarships" CTA button.
   - **Assert**: Navigates cleanly to `/[locale]/student/scholarships`.

---

### Scenario 4: Save from Discovery & Coherence

1. From `/student/scholarships`, click the `Bookmark` icon on a scholarship card.
2. **DevTools Check**:
   - `POST /backend/api/scholarships/{id}/save` returns HTTP `200 OK` with JSON response containing `"is_saved": true`.
3. Navigate to `/student/saved`.
4. **Assert**:
   - The saved scholarship card appears in the grid.
   - Header count updates to "منحة محفوظة واحدة" / "1 saved scholarship".
   - Card displays full localized facts (title, university, country, funding type, deadline) with **no match badge** and **no score fabrication**.
   - Details link on card points to `/[locale]/student/scholarships/{id}`.

---

### Scenario 5: Optimistic Unsave & Exact-Position Rollback

1. On `/student/saved`, click the `Bookmark` icon on a card to unsave it.
2. **Assert (Optimistic UI)**:
   - Card immediately disappears from the grid.
   - Header count updates instantly (e.g. from 1 to 0 / empty state).
3. **DevTools Check**:
   - `DELETE /backend/api/scholarships/{id}/save` returns HTTP `200 OK` with `"is_saved": false`.
4. **Failure Rollback Test (Optional/Throttled Network)**:
   - Enable Offline / Block request in DevTools before clicking Unsave.
   - **Assert**: An assertive live-region error message ("تعذر إزالة هذه المنحة. حاول مرة أخرى.") appears, and the removed card is **restored to its exact original position** in the grid.

---

### Scenario 6: Hard Refresh & Session Persistence

1. Save 2 or 3 scholarships.
2. Navigate to `/student/saved`.
3. Perform a hard browser refresh (**Ctrl+F5** / **Cmd+Shift+R**).
4. **Assert**:
   - Page loads without flickering or unauthorized errors.
   - The grid displays all saved cards with identical order.
   - Subheader count equals array length (e.g., "3 منح محفوظة").

---

### Scenario 7: Negative Path & Error Boundary Check

1. **401 Unauthorized**: Clear cookies via DevTools Application tab while on `/student/saved` and refresh.
   - **Assert**: Renders localized error state asking user to sign in again ("يرجى تسجيل الدخول من جديد لعرض المنح المحفوظة.").
2. **403 Forbidden**: Verify forbidden copy stays generic ("هذا القسم غير متاح لحسابك حالياً.") with **no "account disabled" phrasing** and no automatic retry loop.

---

## 4. Verification Sign-off Record

| Step                      | Inspector    | Date       | Environment                                                                              | Status (PASS/FAIL) |
| ------------------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------- | ------------------ |
| 1. Flag OFF Guard         | Ahmed Zenaty | 2026-10-05 | Local dev (`pnpm dev`) + staging backend (`https://scholarai-backend-2e27.onrender.com`) | **PASS**           |
| 2. Nav & Route Resolution | Ahmed Zenaty | 2026-10-05 | Local dev (`pnpm dev`) + staging backend (`https://scholarai-backend-2e27.onrender.com`) | **PASS**           |
| 3. Empty State            | Ahmed Zenaty | 2026-10-05 | Local dev (`pnpm dev`) + staging backend (`https://scholarai-backend-2e27.onrender.com`) | **PASS**           |
| 4. Save & Coherence       | Ahmed Zenaty | 2026-10-05 | Local dev (`pnpm dev`) + staging backend (`https://scholarai-backend-2e27.onrender.com`) | **PASS**           |
| 5. Optimistic Unsave      | Ahmed Zenaty | 2026-10-05 | Local dev (`pnpm dev`) + staging backend (`https://scholarai-backend-2e27.onrender.com`) | **PASS**           |
| 6. Hard Refresh           | Ahmed Zenaty | 2026-10-05 | Local dev (`pnpm dev`) + staging backend (`https://scholarai-backend-2e27.onrender.com`) | **PASS**           |
| 7. DevTools Network Audit | Ahmed Zenaty | 2026-10-05 | Local dev (`pnpm dev`) + staging backend (`https://scholarai-backend-2e27.onrender.com`) | **PASS**           |
