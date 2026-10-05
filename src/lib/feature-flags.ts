// Server-only feature flags. These variables MUST NOT be prefixed NEXT_PUBLIC_,
// so Next does not inline them into the client bundle and no browser code can
// toggle them. Flipping a flag is a reviewable environment change.

export const featureFlags = Object.freeze({
  // Feature 006: Student Saved Scholarships route + nav item.
  // Default: false. The literal string "true" is the only enabling value.
  get savedScholarshipsEnabled(): boolean {
    return process.env.SAVED_SCHOLARSHIPS_ENABLED === 'true';
  },
});
