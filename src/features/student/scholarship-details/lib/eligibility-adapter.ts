import { scholarshipEligibilitySchema } from '../schemas/eligibility.schema';

// Stable codes, in display order. The UI maps each code to a localized label;
// nothing the backend sends is ever shown as a sentence.
export const ELIGIBILITY_CODES = [
  'nationality',
  'degreeLevel',
  'gender',
  'residency',
  'fieldOfStudy',
  'language',
  'minGpa',
  'maxAge',
  'experience',
  'softSkills',
] as const;

export type EligibilityCode = (typeof ELIGIBILITY_CODES)[number];

// A list that is empty is a known answer: the scholarship has no restriction.
export type EligibilityCriterion =
  | {
      code: 'nationality' | 'residency' | 'fieldOfStudy' | 'language';
      kind: 'list';
      values: string[];
    }
  | { code: 'degreeLevel'; kind: 'levels'; values: string[] }
  | { code: 'gender'; kind: 'gender'; value: string }
  | { code: 'minGpa'; kind: 'percent'; value: number }
  | { code: 'maxAge'; kind: 'years'; value: number }
  | { code: 'experience' | 'softSkills'; kind: 'flag'; required: boolean };

export interface ScholarshipEligibility {
  // Only the criteria the backend answered, in ELIGIBILITY_CODES order.
  criteria: EligibilityCriterion[];
  // How many of the codes the backend left unknown (null or missing).
  unknownCount: number;
}

export class EligibilityContractError extends Error {
  constructor() {
    super('EligibilityContractError: not-object');
    this.name = 'EligibilityContractError';
  }
}

// The single entry point for the eligibility response.
export function parseScholarshipEligibility(raw: unknown): ScholarshipEligibility {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new EligibilityContractError();
  const result = scholarshipEligibilitySchema.safeParse(raw);
  if (!result.success) throw new EligibilityContractError();
  const data = result.data;

  const known: (EligibilityCriterion | null)[] = [
    data.allowed_nationalities
      ? { code: 'nationality', kind: 'list', values: data.allowed_nationalities }
      : null,
    data.target_degree_levels
      ? { code: 'degreeLevel', kind: 'levels', values: data.target_degree_levels }
      : null,
    data.allowed_gender ? { code: 'gender', kind: 'gender', value: data.allowed_gender } : null,
    data.target_residencies
      ? { code: 'residency', kind: 'list', values: data.target_residencies }
      : null,
    data.allowed_fields_of_study
      ? { code: 'fieldOfStudy', kind: 'list', values: data.allowed_fields_of_study }
      : null,
    data.required_languages
      ? { code: 'language', kind: 'list', values: data.required_languages }
      : null,
    typeof data.min_gpa_percentage === 'number'
      ? { code: 'minGpa', kind: 'percent', value: data.min_gpa_percentage }
      : null,
    typeof data.max_age === 'number'
      ? { code: 'maxAge', kind: 'years', value: data.max_age }
      : null,
    typeof data.is_req_experience === 'boolean'
      ? { code: 'experience', kind: 'flag', required: data.is_req_experience }
      : null,
    typeof data.is_Softskills_required === 'boolean'
      ? { code: 'softSkills', kind: 'flag', required: data.is_Softskills_required }
      : null,
  ];
  const criteria = known.flatMap((criterion) => criterion ?? []);
  return { criteria, unknownCount: ELIGIBILITY_CODES.length - criteria.length };
}
