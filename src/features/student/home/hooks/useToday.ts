'use client';

import { useSyncExternalStore } from 'react';
import { msUntilNextLocalMidnight } from '../lib/today';

// The student's current local day. `null` on the server and during hydration (the
// server clock and timezone are not the student's), then the real Date. It is
// refreshed at the next local midnight and whenever the tab becomes visible, so the
// date and the days-left badges never go stale.
let snapshot: Date | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function refresh() {
  snapshot = new Date();
  clearTimeout(timer);
  // One second past midnight, so the new local day has certainly started.
  timer = setTimeout(refresh, msUntilNextLocalMidnight(snapshot) + 1000);
  listeners.forEach((listener) => listener());
}

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') refresh();
};

function subscribe(listener: () => void) {
  if (listeners.size === 0) document.addEventListener('visibilitychange', onVisibilityChange);
  listeners.add(listener);
  refresh();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  };
}

export const useToday = (): Date | null =>
  useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => null
  );
