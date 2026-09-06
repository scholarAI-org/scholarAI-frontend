export type LanguageProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NATIVE';

export interface LanguageItem {
  name: string;
  code?: string;
  proficiency: LanguageProficiency;
}

export interface SkillsAndLanguages {
  languages: LanguageItem[];
  skills: string[];
}

export const emptySkillsAndLanguages: SkillsAndLanguages = {
  languages: [],
  skills: [],
};
