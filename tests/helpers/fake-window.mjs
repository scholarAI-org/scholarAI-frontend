// Just enough of a browser for TanStack Query's timers and focus manager in a node test:
// importing this module defines a global `window` (listeners are recorded, nothing is dispatched).
// Import it BEFORE anything that loads @tanstack/react-query.
const listeners = new Map();

globalThis.window = {
  addEventListener(type, listener) {
    listeners.set(type, [...(listeners.get(type) ?? []), listener]);
  },
  removeEventListener(type, listener) {
    listeners.set(
      type,
      (listeners.get(type) ?? []).filter((entry) => entry !== listener)
    );
  },
  dispatch(type) {
    for (const listener of listeners.get(type) ?? []) listener();
  },
};
