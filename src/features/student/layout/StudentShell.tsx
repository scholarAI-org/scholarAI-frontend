'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { StudentHeader } from './StudentHeader';
import { StudentMobileNavigation } from './StudentMobileNavigation';
import { StudentSidebar } from './StudentSidebar';
import { StudentTabBar } from './StudentTabBar';

import {
  studentNavigation,
  withHomeEnabled,
  withNotificationsEnabled,
  withSavedEnabled,
  withTrackingEnabled,
} from './student-navigation';
import type { StudentNavigationItemId } from './types';

interface StudentShellProps {
  children: ReactNode;
  savedEnabled?: boolean;
  homeEnabled?: boolean;
  trackingEnabled?: boolean;
  // Whether the account menu links to Settings. Not a navigation item.
  settingsEnabled?: boolean;
  // Whether the sidebar (and the drawer) show the Notifications item.
  notificationsEnabled?: boolean;
  // Optional content at the end of a navigation item's row (the unread count pill), supplied by
  // the route layout so the shell stays free of feature code.
  navigationBadges?: Partial<Record<StudentNavigationItemId, ReactNode>>;
  // Optional controls for the desktop header, supplied by the route layout so the shell
  // stays free of page-specific data.
  headerActions?: ReactNode;
  // The same for the compact top bar below lg (a bell there opens the notification center).
  compactHeaderActions?: ReactNode;
}

// Shared student frame, mounted once by src/app/[locale]/student/layout.tsx.
export function StudentShell({
  children,
  savedEnabled = false,
  homeEnabled = false,
  trackingEnabled = false,
  settingsEnabled = false,
  notificationsEnabled = false,
  navigationBadges,
  headerActions,
  compactHeaderActions,
}: StudentShellProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeNavigation = useCallback(() => setIsNavigationOpen(false), []);
  const items = withNotificationsEnabled(
    withTrackingEnabled(
      withHomeEnabled(withSavedEnabled(studentNavigation, savedEnabled), homeEnabled),
      trackingEnabled
    ),
    notificationsEnabled
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-start text-[#434343]">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[236px_minmax(0,1204px)]">
        <div className="min-w-0 lg:order-2">
          <StudentHeader
            isNavigationOpen={isNavigationOpen}
            onNavigationToggle={() => setIsNavigationOpen((open) => !open)}
            menuButtonRef={menuButtonRef}
            settingsEnabled={settingsEnabled}
            headerActions={headerActions}
            compactHeaderActions={compactHeaderActions}
            notificationsEnabled={notificationsEnabled}
          />
          {/* Below sm the fixed tab bar covers the foot of the page, so the content
              reserves its height plus the device's own inset. */}
          <main className="px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-6 lg:pt-6 lg:pb-0">
            {children}
          </main>
        </div>
        <aside className="hidden lg:sticky lg:top-0 lg:order-1 lg:row-span-2 lg:block lg:h-screen lg:self-start">
          <StudentSidebar
            items={items}
            settingsEnabled={settingsEnabled}
            navigationBadges={navigationBadges}
          />
        </aside>
      </div>
      <StudentMobileNavigation
        isOpen={isNavigationOpen}
        onClose={closeNavigation}
        returnFocusRef={menuButtonRef}
        items={items}
        settingsEnabled={settingsEnabled}
        navigationBadges={navigationBadges}
      />
      <StudentTabBar items={items} />
    </div>
  );
}
