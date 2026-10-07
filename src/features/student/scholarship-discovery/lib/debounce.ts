export const SEARCH_DEBOUNCE_MS = 300;

// Timers are looked up at call time so tests can swap them with mock timers.
export function createDebouncer<T>(delayMs: number, commit: (value: T) => void) {
  let handle: ReturnType<typeof setTimeout> | null = null;
  const cancel = () => {
    if (handle !== null) clearTimeout(handle);
    handle = null;
  };
  return {
    schedule(value: T) {
      cancel();
      handle = setTimeout(() => {
        handle = null;
        commit(value);
      }, delayMs);
    },
    flush(value: T) {
      cancel();
      commit(value);
    },
    cancel,
    isPending: () => handle !== null,
  };
}

export type Debouncer<T> = ReturnType<typeof createDebouncer<T>>;
