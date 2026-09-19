export type AdminPageMetadata = {
  namespace: 'AdminDashboard' | 'AdminManualScholarship' | 'AdminScholarshipReview';
  titleKey: 'title';
  descriptionKey: 'description';
};

const adminPageMetadata: Record<string, AdminPageMetadata> = {
  '/admin/dashboard': {
    namespace: 'AdminDashboard',
    titleKey: 'title',
    descriptionKey: 'description',
  },
  '/admin/scholarships/new': {
    namespace: 'AdminManualScholarship',
    titleKey: 'title',
    descriptionKey: 'description',
  },
  '/admin/scholarships/review': {
    namespace: 'AdminScholarshipReview',
    titleKey: 'title',
    descriptionKey: 'description',
  },
};

export function getAdminPageMetadata(pathname: string) {
  return (
    adminPageMetadata[pathname] ??
    (pathname.startsWith('/admin/scholarships/review/')
      ? adminPageMetadata['/admin/scholarships/review']
      : undefined)
  );
}
