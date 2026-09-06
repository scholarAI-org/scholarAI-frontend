import type { DocumentsApi } from '../schemas/documents.schema';
import type { Experience } from '../schemas/experiences.schema';
import type { SkillsAndLanguages } from '../schemas/skills-languages.schema';

// Documents completion: count primary document slots uploaded
export function getDocumentsCompletion(documents: DocumentsApi | null | undefined): number {
  if (!documents) return 0;
  const keys: Array<keyof Omit<DocumentsApi, 'recommendation_letters'>> = [
    'cv',
    'graduation_certificate',
    'transcript',
    'english_test',
    'passport',
  ];
  const uploaded = keys.filter((key) => documents[key].status === 'UPLOADED').length;
  return Math.round((uploaded / keys.length) * 100);
}

// Skills & Languages completion: simple rule: languages present + skills present
export function getSkillsCompletion(data: SkillsAndLanguages | null | undefined): number {
  if (!data) return 0;
  const hasLanguages = Array.isArray(data.languages) && data.languages.length > 0 ? 1 : 0;
  const hasSkills = Array.isArray(data.skills) && data.skills.length > 0 ? 1 : 0;
  // average of two buckets
  return Math.round(((hasLanguages + hasSkills) / 2) * 100);
}

// Generic helper to consider completed if value === 100
export function isCompleted(value: number): boolean {
  return value === 100;
}

// Experiences completion: count if at least one experience exists
export function getExperiencesCompletion(experiences: Experience[] | null | undefined): number {
  if (!experiences) return 0;
  return experiences.length > 0 ? 100 : 0;
}
