export interface FieldOfStudyOption {
  value: string;
  label: string;
  isOpenAlex?: boolean;
}

/**
 * Returns field-of-study options for the Preferences desired degree level.
 * Note: TAWJIHI is not a valid Preferences degree level and is not handled here.
 * All Preferences degree levels (BACHELOR, MASTER, PHD, DIPLOMA, OTHER) use
 * OpenAlex subfields as field-of-study options.
 */
export function getFieldOfStudyOptions(
  degreeLevel?: string | null,
  subfields?: Array<{ id: string; display_name: string }> | null
): FieldOfStudyOption[] {
  if (!degreeLevel) return [];

  return (subfields || []).map((s) => ({
    value: s.id,
    label: s.display_name,
    isOpenAlex: true,
  }));
}
