import { notFound } from 'next/navigation';
import { featureFlags } from '@/lib/feature-flags';
import { SavedScholarshipsPage } from '@/features/student/saved-scholarships';

// Server Component gate. Reads the server-only flag and calls notFound()
// BEFORE any data fetch when the flag is off (Feature 006, FR-023).
export default function Page() {
  if (!featureFlags.savedScholarshipsEnabled) {
    notFound();
  }
  return <SavedScholarshipsPage />;
}
