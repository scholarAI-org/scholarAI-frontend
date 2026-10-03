import { academicLevels, fundingTypes } from '../constants';

// Rule A1 for free-text card fields (funding_type, study_level):
// - a known enum value, in any letter case, shows its translated label;
// - any other value is shown exactly as received;
// - the field is hidden only when the value is null, empty or blank.
export type CardFieldLabel =
  { kind: 'translated'; key: string } | { kind: 'raw'; text: string } | null;

function resolve(
  value: unknown,
  known: readonly string[],
  keyPrefix: 'filters.funding' | 'filters.academicLevel'
): CardFieldLabel {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.trim().toLowerCase();
  return known.includes(normalized)
    ? { kind: 'translated', key: `${keyPrefix}.${normalized}` }
    : { kind: 'raw', text: value };
}

export const getFundingLabel = (value: unknown) => resolve(value, fundingTypes, 'filters.funding');

export const getStudyLevelLabel = (value: unknown) =>
  resolve(value, academicLevels, 'filters.academicLevel');
