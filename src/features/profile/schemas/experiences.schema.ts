export type ExperienceType = 'WORK' | 'VOLUNTEER' | 'RESEARCH' | 'STUDENT_ACTIVITY';

export interface Experience {
  id?: number;
  experience_type: ExperienceType;
  title: string;
  organization: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  is_current: boolean;
  description?: string | null;
}

export type ExperienceCreate = Omit<Experience, 'id'>;
export type ExperienceUpdate = Partial<ExperienceCreate>;
