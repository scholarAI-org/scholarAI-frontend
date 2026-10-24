// Home sections whose backend API does not exist yet. They read through a
// HomeSource (see ../sources) that is real, demo (local dev only) or unavailable.
export const HOME_SECTION_IDS = ['notifications', 'activity', 'recommendations'] as const;
export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

// Flip a section to true ONLY after the backend ships it and the response was verified
// against specs/009-student-home/contracts/requested-backend.openapi.yaml.
// Real always wins over demo data. Tick the pre-launch checklist in verification.md.
export const HOME_API_AVAILABILITY: Readonly<Record<HomeSectionId, boolean>> = Object.freeze({
  notifications: false,
  activity: false,
  recommendations: false,
});
