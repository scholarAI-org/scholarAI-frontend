import { Suspense } from 'react';
import { featureFlags } from '@/lib/feature-flags';
import { ScholarshipDiscoveryPage } from '@/features/student/scholarship-discovery/components/ScholarshipDiscoveryPage';

// useSearchParams in the discovery page needs a Suspense boundary.
export default function StudentScholarshipsPage() {
  return (
    <Suspense>
      <ScholarshipDiscoveryPage detailsEnabled={featureFlags.scholarshipDetailsEnabled} />
    </Suspense>
  );
}
