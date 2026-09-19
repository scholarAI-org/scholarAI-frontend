import { ScholarshipReviewEditPage } from '@/features/admin/scholarship-review/components/ScholarshipReviewEditPage';

export default async function AdminScholarshipReviewEditRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScholarshipReviewEditPage id={Number(id)} />;
}
