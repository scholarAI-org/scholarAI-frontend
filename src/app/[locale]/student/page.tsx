import { notFound } from 'next/navigation';
import { StudentHomePage } from '@/features/student/home';
import { resolveHomeMockSections } from '@/features/student/home/config/resolve-mock-sections';
import { featureFlags } from '@/lib/feature-flags';

// Server Component gate. Reads the server-only flag and calls notFound() BEFORE
// anything renders or fetches when Student Home is off (Feature 009, FR-003).
export default function Page() {
  if (!featureFlags.studentHomeEnabled) {
    notFound();
  }
  return (
    <StudentHomePage
      detailsEnabled={featureFlags.scholarshipDetailsEnabled}
      savedEnabled={featureFlags.savedScholarshipsEnabled}
      // Feature 011: the unread count is real, and its card links to the center.
      notificationsEnabled={featureFlags.notificationsEnabled}
      // Demo data for sections without a backend API: local development only, never in
      // a production build or on Vercel Production/Preview (see resolveHomeMockSections).
      mockSections={resolveHomeMockSections(process.env)}
    />
  );
}
