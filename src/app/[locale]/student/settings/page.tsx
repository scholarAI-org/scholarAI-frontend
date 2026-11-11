import { notFound } from 'next/navigation';
import { featureFlags } from '@/lib/feature-flags';
import { SettingsPage } from '@/features/student/settings';

// Server Component gate. Reads the server-only flag and calls notFound() BEFORE any
// client render or request when the flag is off (Feature 010).
export default function Page() {
  if (!featureFlags.settingsEnabled) {
    notFound();
  }
  return <SettingsPage />;
}
