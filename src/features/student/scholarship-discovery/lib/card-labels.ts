import { academicLevels, fundingTypes } from '../constants';

// Rule A1 for free-text card fields (funding_type, study_level):
// - a known enum value, in any letter case, shows its translated label;
// - any other value is shown exactly as received;
// - the field is hidden only when the value is null, empty or blank.
// Study level may list several levels separated by , ، ; or / (the same
// separators the backend matcher accepts); each part follows the same rule.
type SingleLabel = { kind: 'translated'; key: string } | { kind: 'raw'; text: string };
export type CardFieldLabel = SingleLabel | { kind: 'list'; parts: SingleLabel[] } | null;

const STUDY_LEVEL_SEPARATORS = /[,،;/]/;

function resolveSingle(
  value: string,
  known: readonly string[],
  keyPrefix: 'filters.funding' | 'filters.academicLevel'
): SingleLabel {
  const normalized = value.trim().toLowerCase();
  return known.includes(normalized)
    ? { kind: 'translated', key: `${keyPrefix}.${normalized}` }
    : { kind: 'raw', text: value };
}

export function getFundingLabel(value: unknown): CardFieldLabel {
  if (typeof value !== 'string' || !value.trim()) return null;
  return resolveSingle(value, fundingTypes, 'filters.funding');
}

export function getStudyLevelLabel(value: unknown): CardFieldLabel {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parts = value
    .split(STUDY_LEVEL_SEPARATORS)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) {
    return resolveSingle(
      STUDY_LEVEL_SEPARATORS.test(value) ? parts[0] : value,
      academicLevels,
      'filters.academicLevel'
    );
  }
  return {
    kind: 'list',
    parts: parts.map((part) => resolveSingle(part, academicLevels, 'filters.academicLevel')),
  };
}

const LIST_SEPARATOR: Record<string, string> = { ar: '، ' };

// Text for a card field; list parts are joined with the locale's separator.
export function formatCardFieldLabel(
  label: CardFieldLabel,
  translate: (key: string) => string,
  locale: string
): string | undefined {
  if (label === null) return undefined;
  const single = (part: SingleLabel) =>
    part.kind === 'translated' ? translate(part.key) : part.text;
  return label.kind === 'list'
    ? label.parts.map(single).join(LIST_SEPARATOR[locale] ?? ', ')
    : single(label);
}
