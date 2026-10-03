// The details route (T052) does not exist yet. Keep this off until
// src/app/[locale]/student/scholarships/[id]/page.tsx is added, so cards never
// link to a 404; a test fails if the route and this flag disagree.
export const SCHOLARSHIP_DETAILS_ROUTE_ENABLED = false;

export const getScholarshipDetailsHref = (id: number) =>
  SCHOLARSHIP_DETAILS_ROUTE_ENABLED && Number.isInteger(id) && id > 0
    ? `/student/scholarships/${id}`
    : null;
