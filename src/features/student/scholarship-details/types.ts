import type { OpportunityType, ScholarshipApplicationStatus } from './schemas/details.schema';

export type {
  OpportunityType,
  ScholarshipApplicationStatus,
  ScholarshipDetailsData,
} from './schemas/details.schema';

// What the page renders. Optional values are simply absent; lists are empty
// arrays; links are already checked and safe to put in an href.
export interface ScholarshipDetailsViewModel {
  id: number;
  title: string;
  isSaved: boolean;
  organizationName?: string;
  universityName?: string;
  country?: string;
  imageUrl?: string;
  // Canonical ScholarshipStudyLevel codes; an unknown value is kept as received.
  studyLevels: string[];
  fundingType?: string;
  opportunityType?: OpportunityType;
  applicationStatus: ScholarshipApplicationStatus;
  // Calendar dates (YYYY-MM-DD) and an instant, as received.
  deadline?: string;
  noDeadline: boolean;
  openingDate?: string;
  publishedAt?: string;
  source?: string;
  sourceUrl?: string;
  fundingAmount?: string;
  languageRequirements?: string;
  eligibleNationalities?: string;
  academicYear?: string;
  gpaRequirement?: string;
  ageRequirement?: string;
  majors: string[];
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  apply: { link?: string; email?: string; phone?: string };
  applyText: { email?: string; phone?: string };
  pdfUrl?: string;
  attachments: string[];
  isExtension: boolean;
}
