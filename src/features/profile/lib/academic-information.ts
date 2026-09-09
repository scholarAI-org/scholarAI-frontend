import {
  academicInformationApiSchema,
  type AcademicInformationApi,
} from '../schemas/academic-information-api.schema';
import { type AcademicInformationFormData } from '../schemas/academic-information.schema';

export const emptyAcademicInformation: AcademicInformationFormData = {
  currentLevel: '',
  fieldOfStudy: '',
  fieldOfStudyOpenAlexId: null,
  institution: '',
  graduationYear: '',
  gpaValue: '',
  gpaSystem: '',
  studyLanguage: '',
  studyStatus: '',
  researchSpecialization: null,
  researchSpecializationOpenAlexId: null,
};

export const academicInformationFieldMap: Record<
  string,
  keyof AcademicInformationFormData | string
> = {
  academic_level: 'currentLevel',
  field_of_study: 'fieldOfStudy',
  field_of_study_openalex_id: 'fieldOfStudyOpenAlexId',
  institution: 'institution',
  expected_graduation_year: 'graduationYear',
  gpa: 'gpaValue',
  'gpa.value': 'gpaValue',
  'gpa.scale': 'gpaSystem',
  current_study_language: 'studyLanguage',
  study_status: 'studyStatus',
  research_specialization: 'researchSpecialization',
  research_specialization_openalex_id: 'researchSpecializationOpenAlexId',
};

export function toAcademicInformationForm(
  data?: Partial<AcademicInformationApi> | null
): AcademicInformationFormData {
  if (!data) return emptyAcademicInformation;

  const gpaValueStr = data.gpa?.value !== undefined ? String(data.gpa.value) : '';
  const gpaSystemStr = data.gpa?.scale || '';

  const yearStr = data.expected_graduation_year ? `${data.expected_graduation_year}-01-01` : '';

  const firstLanguage = (data.current_study_language?.[0] ||
    '') as AcademicInformationFormData['studyLanguage'];

  return {
    currentLevel: data.academic_level ?? '',
    fieldOfStudy: data.field_of_study ?? '',
    fieldOfStudyOpenAlexId: data.field_of_study_openalex_id ?? null,
    institution: data.institution ?? '',
    graduationYear: yearStr,
    gpaValue: gpaValueStr,
    gpaSystem: gpaSystemStr,
    studyLanguage: firstLanguage,
    studyStatus: data.study_status ?? '',
    researchSpecialization: data.research_specialization ?? null,
    researchSpecializationOpenAlexId: data.research_specialization_openalex_id ?? null,
  };
}

export function toAcademicInformationPayload(
  data: AcademicInformationFormData
): AcademicInformationApi {
  // Transform date string (e.g. "2026/05/02" or "2026-05") into an integer year
  let parsedYear: number | undefined;
  if (data.graduationYear) {
    const yearPart = data.graduationYear.split(/[-/]/)[0];
    if (yearPart && !isNaN(Number(yearPart))) {
      parsedYear = Number(yearPart);
    }
  }

  // Build the nested GPA object if valid
  let gpaObject = undefined;
  if (data.gpaValue && data.gpaSystem) {
    const gpaNum = parseFloat(data.gpaValue);
    if (!isNaN(gpaNum)) {
      gpaObject = {
        value: gpaNum,
        scale: data.gpaSystem,
      };
    }
  }

  return academicInformationApiSchema.parse({
    academic_level: data.currentLevel,
    field_of_study: data.fieldOfStudy,
    field_of_study_openalex_id: data.fieldOfStudyOpenAlexId,
    institution: data.institution ? data.institution.trim() : null,
    expected_graduation_year: parsedYear,
    gpa: gpaObject,
    current_study_language: data.studyLanguage ? [data.studyLanguage] : [],
    study_status: data.studyStatus || null,
    research_specialization: data.researchSpecialization,
    research_specialization_openalex_id: data.researchSpecializationOpenAlexId,
  });
}

const requiredFields = [
  'currentLevel',
  'fieldOfStudy',
  'graduationYear',
  'gpaValue',
  'gpaSystem',
  'studyStatus',
] as const;

export function getAcademicInformationCompletion(
  values: Partial<AcademicInformationFormData>
): number {
  const filledFields = requiredFields.filter((field) => {
    const val = values[field];
    return val !== undefined && val !== null && val !== '';
  });

  return Math.round((filledFields.length / requiredFields.length) * 100);
}
