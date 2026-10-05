// Details route link helper. Accepts optional enabled boolean (defaults to true for client components).
export const SCHOLARSHIP_DETAILS_ROUTE_ENABLED = true;

export const getScholarshipDetailsHref = (id: number, enabled: boolean = true) =>
  enabled && Number.isSafeInteger(id) && id > 0 ? `/student/scholarships/${id}` : null;
