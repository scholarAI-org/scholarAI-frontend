/** Seconds and pixels, shared by entrances and existing interactive controls. */
export const landingMotion = {
  feedback: 0.18,
  entrance: 0.48,
  stagger: 0.08,
  maxDelay: 0.24,
  distance: 12,
  ease: [0.22, 1, 0.36, 1] as const,
};
