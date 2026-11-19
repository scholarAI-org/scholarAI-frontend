'use client';

import { useSyncExternalStore } from 'react';

// "Now" for the relative time labels. `null` on the server and during hydration (the server
// clock is not the student's), then the real Date, refreshed about once a minute while the
// tab is visible and straight away when it becomes visible again. No network use.
const TICK_MS = 60_000;

let snapshot: Date | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function refresh() {
  snapshot = new Date();
  listeners.forEach((listener) => listener());
}

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') refresh();
};

const onTick = () => {
  if (document.visibilityState !== 'hidden') refresh();
};

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    document.addEventListener('visibilitychange', onVisibilityChange);
    timer = setInterval(onTick, TICK_MS);
  }
  listeners.add(listener);
  refresh();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  };
}

export const useMinuteClock = (): Date | null =>
  useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => null
  );
