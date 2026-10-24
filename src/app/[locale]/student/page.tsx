import { notFound } from 'next/navigation';
import { StudentHomePage } from '@/features/student/home';
import { featureFlags } from '@/lib/feature-flags';

// Server Component gate. Reads the server-only flag and calls notFound() BEFORE
// anything renders or fetches when Student Home is off (Feature 009, FR-003).
export default function Page() {
  if (!featureFlags.studentHomeEnabled) {
    notFound();
  }
  return <StudentHomePage />;
}
