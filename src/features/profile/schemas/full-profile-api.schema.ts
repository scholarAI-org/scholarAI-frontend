import {
  type PersonalInformation,
  emptyPersonalInformation,
  normalizePersonalInformation,
} from './personal-information-api.schema';
import {
  type AcademicInformationApi,
  emptyAcademicInformation,
  normalizeAcademicInformation,
} from './academic-information-api.schema';
import {
  type Document,
  type DocumentsApi,
  type UploadStatus,
  emptyDocuments,
  createEmptyDocument,
} from './documents.schema';
import { type SkillsAndLanguages, emptySkillsAndLanguages } from './skills-languages.schema';
import { type Experience } from './experiences.schema';
import {
  type PreferencesApi,
  emptyPreferences,
  normalizePreferences,
} from './preferences-api.schema';

export interface FullProfileApi {
  id: number | null;
  user_id: number | null;
  personal: Partial<PersonalInformation>;
  academic: Partial<AcademicInformationApi>;
  documents: DocumentsApi;
  skills_languages: SkillsAndLanguages;
  experiences: Experience[];
  preferences: PreferencesApi;
  avatar_url: string | null;
  profile_completion_percentage: number | null;
}

export const emptyFullProfile: FullProfileApi = {
  id: null,
  user_id: null,
  personal: emptyPersonalInformation,
  academic: emptyAcademicInformation,
  documents: emptyDocuments,
  skills_languages: emptySkillsAndLanguages,
  experiences: [],
  preferences: emptyPreferences,
  avatar_url: null,
  profile_completion_percentage: null,
};

export function normalizeSingleDocument(
  doc?: Partial<Document> | null,
  defaultType: string | null = null
): Document {
  if (!doc || typeof doc !== 'object') {
    return createEmptyDocument(defaultType);
  }
  return {
    id: doc.id ?? null,
    document_type: doc.document_type ?? defaultType,
    file_name: doc.file_name ?? null,
    content_type: doc.content_type ?? null,
    file_size: doc.file_size ?? null,
    status: (doc.status as UploadStatus) || (doc.id ? 'UPLOADED' : 'NOT_UPLOADED'),
    uploaded_at: doc.uploaded_at ?? null,
  };
}

export function normalizeDocuments(value?: Partial<DocumentsApi> | null): DocumentsApi {
  if (!value) return emptyDocuments;
  return {
    cv: normalizeSingleDocument(value.cv, 'cv'),
    transcript: normalizeSingleDocument(value.transcript, 'transcript'),
    graduation_certificate: normalizeSingleDocument(
      value.graduation_certificate,
      'graduation_certificate'
    ),
    passport: normalizeSingleDocument(value.passport, 'passport'),
    recommendation_letters: Array.isArray(value.recommendation_letters)
      ? value.recommendation_letters.map((doc) =>
          normalizeSingleDocument(doc, 'recommendation_letter')
        )
      : [],
    english_test: normalizeSingleDocument(value.english_test, 'english_test'),
    university_admission_letter: normalizeSingleDocument(
      value.university_admission_letter,
      'university_admission_letter'
    ),
  };
}

export function normalizeSkillsAndLanguages(
  value?: Partial<SkillsAndLanguages> | null
): SkillsAndLanguages {
  if (!value) return emptySkillsAndLanguages;
  return {
    languages: Array.isArray(value.languages) ? value.languages : [],
    skills: Array.isArray(value.skills) ? value.skills : [],
  };
}

export function normalizeFullProfile(value?: Partial<FullProfileApi> | unknown): FullProfileApi {
  if (!value || typeof value !== 'object') return emptyFullProfile;

  const val = value as Record<string, unknown>;
  const rawPersonal = (val.personal ?? val.personal_info ?? val.personal_information) as
    Partial<PersonalInformation> | null | undefined;
  const rawAcademic = (val.academic ?? val.academic_info ?? val.academic_information) as
    Partial<AcademicInformationApi> | null | undefined;
  const rawDocuments = val.documents as Partial<DocumentsApi> | null | undefined;
  const rawSkillsLangs = val.skills_languages ??
    val.skills_and_languages ?? {
      skills: val.skills,
      languages: val.languages,
    };
  const rawExperiences = val.experiences;
  const rawPreferences = val.preferences as Partial<PreferencesApi> | null | undefined;

  return {
    id: typeof val.id === 'number' ? val.id : null,
    user_id: typeof val.user_id === 'number' ? val.user_id : null,
    personal: normalizePersonalInformation(rawPersonal),
    academic: normalizeAcademicInformation(rawAcademic),
    documents: normalizeDocuments(rawDocuments),
    skills_languages: normalizeSkillsAndLanguages(
      rawSkillsLangs as Partial<SkillsAndLanguages> | null | undefined
    ),
    experiences: Array.isArray(rawExperiences) ? rawExperiences : [],
    preferences: normalizePreferences(rawPreferences),
    avatar_url: typeof val.avatar_url === 'string' ? val.avatar_url : null,
    profile_completion_percentage:
      typeof val.profile_completion_percentage === 'number'
        ? val.profile_completion_percentage
        : null,
  };
}
