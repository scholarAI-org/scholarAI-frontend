import { fieldOfStudyValues } from '../schemas/academic-information.schema';

export interface FieldOfStudyOption {
  value: string;
  label: string;
  isOpenAlex?: boolean;
}

export function getFieldOfStudyOptions(
  degreeLevel?: string | null,
  subfields?: Array<{ id: string; display_name: string }> | null,
  translator?: (key: string) => string
): FieldOfStudyOption[] {
  if (!degreeLevel) return [];

  if (degreeLevel === 'TAWJIHI') {
    return fieldOfStudyValues.map((value) => ({
      value,
      label: translator ? translator(`fieldsOfStudy.${value}`) : value,
      isOpenAlex: false,
    }));
  }

  return (subfields || []).map((s) => ({
    value: s.id,
    label: s.display_name,
    isOpenAlex: true,
  }));
}
