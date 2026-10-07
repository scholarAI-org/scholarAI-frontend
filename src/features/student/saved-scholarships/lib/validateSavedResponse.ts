import { isDiscoveryCardShape } from '@/features/student/scholarship-discovery/adapters/scholarship';
import type { ScholarshipDiscoveryCard } from '@/features/student/scholarship-discovery/types';

// Non-user-visible reason codes. UI copy must stay generic (plan FR-005/FR-006).
export type SavedContractErrorReason =
  'not-array' | 'empty-item-shape' | 'missing-is-saved' | 'is-saved-false';

export class SavedContractError extends Error {
  readonly reason: SavedContractErrorReason;
  readonly itemIndex?: number;
  constructor(reason: SavedContractErrorReason, itemIndex?: number) {
    super(`SavedContractError: ${reason}`);
    this.name = 'SavedContractError';
    this.reason = reason;
    this.itemIndex = itemIndex;
  }
}

export type ValidateSavedResponseResult =
  { ok: true; cards: ScholarshipDiscoveryCard[] } | { ok: false; error: SavedContractError };

// Accepts ONLY the TARGET contract: an array of discovery-card-compatible items,
// each with is_saved === true. Anything else is a typed contract error — never
// coerced to an empty success. Empty [] is a legitimate success (zero cards).
export function validateSavedResponse(raw: unknown): ValidateSavedResponseResult {
  if (!Array.isArray(raw)) {
    return { ok: false, error: new SavedContractError('not-array') };
  }
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!isDiscoveryCardShape(item)) {
      const obj = item && typeof item === 'object' ? (item as Record<string, unknown>) : null;
      if (obj && typeof obj.is_saved !== 'boolean') {
        return { ok: false, error: new SavedContractError('missing-is-saved', i) };
      }
      return { ok: false, error: new SavedContractError('empty-item-shape', i) };
    }
    if (item.is_saved !== true) {
      return { ok: false, error: new SavedContractError('is-saved-false', i) };
    }
  }
  return { ok: true, cards: raw as ScholarshipDiscoveryCard[] };
}
