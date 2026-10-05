import { notFound } from 'next/navigation';
import { featureFlags } from '@/lib/feature-flags';
import { ScholarshipDetailsPage } from '@/features/student/scholarship-details';

// Server Component gate for scholarship details route.
// Validates positive integer route param and reads server-only feature flag.
export default async function StudentScholarshipDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!featureFlags.scholarshipDetailsEnabled) {
    notFound();
  }

  const { id } = await params;
  const numId = Number(id);

  if (!Number.isSafeInteger(numId) || numId <= 0 || !/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  return <ScholarshipDetailsPage rawId={id} />;
}
