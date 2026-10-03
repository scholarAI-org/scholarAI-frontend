import { academicLevels, fundingTypes } from '../constants';
import type { AcademicLevel, FundingType } from '../types';

const normalize = (value: string) => value.trim().toLowerCase();

// Card funding/study-level values are free text from the backend. Known values use
// the translated filter label; anything else is shown as the backend wrote it.
export function getFundingLabelKey(value: string | undefined) {
  const key = value && normalize(value);
  return key && fundingTypes.includes(key as FundingType)
    ? (`filters.funding.${key}` as const)
    : null;
}

export function getStudyLevelLabelKey(value: string | undefined) {
  const key = value && normalize(value);
  return key && academicLevels.includes(key as AcademicLevel)
    ? (`filters.academicLevel.${key}` as const)
    : null;
}
