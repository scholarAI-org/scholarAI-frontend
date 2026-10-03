// On since the details route (T052) exists at
// src/app/[locale]/student/scholarships/[id]/page.tsx; a test fails if the route
// and this flag disagree, so cards never link to a 404.
export const SCHOLARSHIP_DETAILS_ROUTE_ENABLED = true;

export const getScholarshipDetailsHref = (id: number) =>
  SCHOLARSHIP_DETAILS_ROUTE_ENABLED && Number.isSafeInteger(id) && id > 0
    ? `/student/scholarships/${id}`
    : null;
