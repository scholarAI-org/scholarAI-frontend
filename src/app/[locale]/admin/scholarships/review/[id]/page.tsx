import { ScholarshipReviewDetailPage } from '@/features/admin/scholarship-review/components/ScholarshipReviewDetailPage';

export default async function AdminScholarshipReviewDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScholarshipReviewDetailPage id={Number(id)} />;
}
