import { notFound } from 'next/navigation';
import { featureFlags } from '@/lib/feature-flags';
import { TrackingPage } from '@/features/student/application-tracking';

// Server Component gate. Reads the server-only flag and calls notFound()
// BEFORE any data fetch or client render when the flag is off (Feature 008).
export default function Page() {
  if (!featureFlags.trackingEnabled) {
    notFound();
  }
  return (
    <TrackingPage
      detailsEnabled={featureFlags.scholarshipDetailsEnabled}
      savedEnabled={featureFlags.savedScholarshipsEnabled}
    />
  );
}
