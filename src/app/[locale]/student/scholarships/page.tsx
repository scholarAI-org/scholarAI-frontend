import { Suspense } from 'react';
import { ScholarshipDiscoveryPage } from '@/features/student/scholarship-discovery/components/ScholarshipDiscoveryPage';

// useSearchParams in the discovery page needs a Suspense boundary.
export default function StudentScholarshipsPage() {
  return (
    <Suspense>
      <ScholarshipDiscoveryPage />
    </Suspense>
  );
}
