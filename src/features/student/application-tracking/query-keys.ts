// Independent of studentScholarshipKeys.saved(): the saved and tracked lists are
// separate on the backend and must not invalidate each other by accident.
export const trackingKeys = {
  all: ['student-application-tracking'] as const,
  list: () => [...trackingKeys.all, 'list'] as const,
};
