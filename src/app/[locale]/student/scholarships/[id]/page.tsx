import { ScholarshipDetailsPage } from '@/features/student/scholarship-discovery/components/ScholarshipDetailsPage';

// Thin route: ID validation, data and states live in the feature component.
export default async function StudentScholarshipDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScholarshipDetailsPage rawId={id} />;
}
