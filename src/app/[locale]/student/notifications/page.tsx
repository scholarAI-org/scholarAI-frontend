import { notFound } from 'next/navigation';
import { featureFlags } from '@/lib/feature-flags';
import { NotificationsPage } from '@/features/student/notifications';

// Server Component gate. Reads the server-only flag and calls notFound() BEFORE any client
// render or request when Student Notifications is off (Feature 011).
export default function Page() {
  if (!featureFlags.notificationsEnabled) {
    notFound();
  }
  return <NotificationsPage detailsEnabled={featureFlags.scholarshipDetailsEnabled} />;
}
