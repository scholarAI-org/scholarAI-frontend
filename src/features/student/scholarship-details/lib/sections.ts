import { parseCalendarDate } from '@/features/student/scholarship-discovery/lib/deadlines';
import type { ScholarshipDetailsViewModel as Details } from '../types';

// What each details section shows, decided in one place. A section with nothing
// to show is not rendered: no empty card and no placeholder. The one exception
// is the deadline, which always shows (no deadline / not specified included).

export interface VisibleSections {
  about: boolean;
  funding: boolean;
  eligibility: boolean;
  documents: boolean;
  dates: boolean;
  source: boolean;
}

export type EligibilityFact =
  | { field: 'studyLevels'; kind: 'levels'; levels: string[] }
  | { field: 'majors'; kind: 'chips'; items: string[] }
  // The backend states the scholarship is open to every field (never inferred).
  | { field: 'majors'; kind: 'allFields' }
  | {
      field:
        | 'eligibleNationalities'
        | 'languageRequirements'
        | 'gpaRequirement'
        | 'ageRequirement'
        | 'academicYear';
      kind: 'text';
      text: string;
    };

export type DateFact =
  | { field: 'openingDate'; value: string }
  | { field: 'deadline' }
  | { field: 'publishedAt'; value: Date }
  | { field: 'lastUpdatedAt'; value: Date };

export interface SourceItems {
  source?: { text: string; href: string | null };
  pdfUrl?: string;
  attachments: string[];
}

export function getEligibilityFacts(details: Details): EligibilityFact[] {
  const facts: EligibilityFact[] = [];
  if (details.studyLevels.length > 0) {
    facts.push({ field: 'studyLevels', kind: 'levels', levels: details.studyLevels });
  }
  if (details.majors.length > 0) {
    facts.push({ field: 'majors', kind: 'chips', items: details.majors });
  } else if (details.fieldsOfStudyScope === 'all') {
    facts.push({ field: 'majors', kind: 'allFields' });
  }
  const text = (
    field: Extract<EligibilityFact, { kind: 'text' }>['field'],
    value: string | undefined
  ) => {
    if (value) facts.push({ field, kind: 'text', text: value });
  };
  text('eligibleNationalities', details.eligibleNationalities);
  text('languageRequirements', details.languageRequirements);
  text('gpaRequirement', details.gpaRequirement);
  text('ageRequirement', details.ageRequirement);
  text('academicYear', details.academicYear);
  return facts;
}

export function getDateFacts(details: Details): DateFact[] {
  const facts: DateFact[] = [];
  if (parseCalendarDate(details.openingDate)) {
    facts.push({ field: 'openingDate', value: details.openingDate as string });
  }
  facts.push({ field: 'deadline' });
  const instant = (value: string | undefined) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
  };
  const published = instant(details.publishedAt);
  if (published) facts.push({ field: 'publishedAt', value: published });
  const updated = instant(details.lastUpdatedAt);
  if (updated) facts.push({ field: 'lastUpdatedAt', value: updated });
  return facts;
}

export function getSourceItems(details: Details): SourceItems {
  const items: SourceItems = { attachments: details.attachments };
  if (details.source) items.source = { text: details.source, href: details.sourceUrl ?? null };
  if (details.pdfUrl) items.pdfUrl = details.pdfUrl;
  return items;
}

export function getVisibleSections(details: Details): VisibleSections {
  const source = getSourceItems(details);
  return {
    about: Boolean(
      details.description ||
      details.organizationName ||
      details.universityName ||
      details.country ||
      details.opportunityType
    ),
    funding: Boolean(
      details.fundingType ||
      details.fundingAmount ||
      details.fundingSummary ||
      details.fundingDuration ||
      details.benefits.length > 0
    ),
    eligibility: getEligibilityFacts(details).length > 0 || details.eligibilityCriteria.length > 0,
    documents: details.requiredDocuments.length > 0,
    dates: true,
    source: Boolean(source.source || source.pdfUrl || source.attachments.length > 0),
  };
}
