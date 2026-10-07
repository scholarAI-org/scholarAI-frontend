import type { ScholarshipDetailsResponse } from '../types';

export type DetailsContractErrorReason =
  | 'not-object'
  | 'invalid-id'
  | 'missing-title'
  | 'missing-is-saved'
  | 'missing-ingestion-type'
  | 'missing-source';

export class DetailsContractError extends Error {
  readonly reason: DetailsContractErrorReason;
  constructor(reason: DetailsContractErrorReason) {
    super(`DetailsContractError: ${reason}`);
    this.name = 'DetailsContractError';
    this.reason = reason;
  }
}

export type ValidateDetailsResponseResult =
  { ok: true; data: ScholarshipDetailsResponse } | { ok: false; error: DetailsContractError };

export function isScholarshipDetailsShape(item: unknown): item is ScholarshipDetailsResponse {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    Number.isInteger(obj.id) &&
    (obj.id as number) > 0 &&
    typeof obj.title === 'string' &&
    typeof obj.is_saved === 'boolean' &&
    typeof obj.ingestion_type === 'string' &&
    typeof obj.source === 'string'
  );
}

export function validateDetailsResponse(raw: unknown): ValidateDetailsResponseResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: new DetailsContractError('not-object') };
  }
  const obj = raw as Record<string, unknown>;
  if (!Number.isInteger(obj.id) || (obj.id as number) <= 0) {
    return { ok: false, error: new DetailsContractError('invalid-id') };
  }
  if (typeof obj.title !== 'string') {
    return { ok: false, error: new DetailsContractError('missing-title') };
  }
  if (typeof obj.is_saved !== 'boolean') {
    return { ok: false, error: new DetailsContractError('missing-is-saved') };
  }
  if (typeof obj.ingestion_type !== 'string') {
    return { ok: false, error: new DetailsContractError('missing-ingestion-type') };
  }
  if (typeof obj.source !== 'string') {
    return { ok: false, error: new DetailsContractError('missing-source') };
  }
  return { ok: true, data: raw as ScholarshipDetailsResponse };
}
