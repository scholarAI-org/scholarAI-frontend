// Details route link helper.
// Client link visibility is controlled by passing `detailsEnabled` boolean prop
// from the server component flag check — never hardcoded.

export const getScholarshipDetailsHref = (id: number, enabled: boolean) =>
  enabled && Number.isSafeInteger(id) && id > 0 ? `/student/scholarships/${id}` : null;
