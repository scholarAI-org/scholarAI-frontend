export const scholarshipReviewKeys = {
  all: ['admin', 'scholarship-review'] as const,
  statistics: () => [...scholarshipReviewKeys.all, 'statistics'] as const,
  list: (page: number, pageSize: number) =>
    [...scholarshipReviewKeys.all, 'list', { page, pageSize, status: 'pending' }] as const,
  detail: (id: number) => [...scholarshipReviewKeys.all, 'detail', id] as const,
};
