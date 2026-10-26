// Backend ApplicationTrackingStatus enum (docs/api/openapi.json), in lifecycle order.
export const TRACKING_STATUSES = [
  'preparing_documents',
  'ready_to_apply',
  'applied',
  'accepted',
  'rejected',
  'closed',
] as const;

// Status cards in the Figma (2415:4656). `saved` is UI-only: it reads the saved
// list, never tracking, so it is not a TrackingStatus and cannot be sent to the API.
export const TRACKING_CARD_ORDER = ['saved', ...TRACKING_STATUSES] as const;

// ApplicationNoteUpdate.notes maxLength, counted in code points like the backend.
export const NOTE_MAX_LENGTH = 2000;
