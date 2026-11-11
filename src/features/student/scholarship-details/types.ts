import type { OpportunityType, ScholarshipApplicationStatus } from './schemas/details.schema';

export type {
  OpportunityType,
  ScholarshipApplicationStatus,
  ScholarshipDetailsData,
} from './schemas/details.schema';
export type { ScholarshipDetailViewData } from './schemas/detail-view.schema';

// One required document. The new details endpoint adds the type and whether it is
// mandatory; the older endpoint only has the name.
export interface RequiredDocumentItem {
  name: string;
  type?: string;
  mandatory?: boolean;
}

// What the page renders. Optional values are simply absent; lists are empty
// arrays; links are already checked and safe to put in an href.
export interface ScholarshipDetailsViewModel {
  id: number;
  title: string;
  isSaved: boolean;
  organizationName?: string;
  universityName?: string;
  country?: string;
  // Plain text: paragraphs separated by a blank line, list items by a newline.
  description?: string;
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
  // Instant (UTC) of the last change to the listing; new endpoint only.
  lastUpdatedAt?: string;
  source?: string;
  sourceUrl?: string;
  fundingAmount?: string;
  // New endpoint: coverage summary, duration and the list of benefits.
  fundingSummary?: string;
  fundingDuration?: { min: number; max: number };
  benefits: string[];
  languageRequirements?: string;
  eligibleNationalities?: string;
  academicYear?: string;
  gpaRequirement?: string;
  ageRequirement?: string;
  majors: string[];
  // "all" = open to every field; absent = unknown (never inferred from an empty list).
  fieldsOfStudyScope?: 'all' | 'specific';
  eligibilityCriteria: string[];
  requiredDocuments: RequiredDocumentItem[];
  apply: { link?: string; email?: string; phone?: string };
  applyText: { email?: string; phone?: string };
  pdfUrl?: string;
  attachments: string[];
  isExtension: boolean;
}
