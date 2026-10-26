import { NOTE_MAX_LENGTH } from '../constants';

// The backend counts code points, so an emoji is one character, not two.
export const noteLength = (value: string) => [...value].length;

export type NoteDraftState = 'unchanged' | 'too-long' | 'valid';

// A draft is saveable when it differs from the saved note (blank counts as no
// note) and is within the limit.
export function getNoteDraftState(draft: string, saved: string | null): NoteDraftState {
  if (noteLength(draft) > NOTE_MAX_LENGTH) return 'too-long';
  const normalize = (value: string | null) => (value ?? '').trim();
  return normalize(draft) === normalize(saved) ? 'unchanged' : 'valid';
}
