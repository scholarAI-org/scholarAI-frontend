// Details route link helper.
/**
 * @deprecated Legacy flag constant kept for test backwards-compatibility.
 * Client link visibility is controlled by passing `detailsEnabled` boolean prop from server component flag check.
 */
export const SCHOLARSHIP_DETAILS_ROUTE_ENABLED = true;

export const getScholarshipDetailsHref = (id: number, enabled: boolean = true) =>
  enabled && Number.isSafeInteger(id) && id > 0 ? `/student/scholarships/${id}` : null;
