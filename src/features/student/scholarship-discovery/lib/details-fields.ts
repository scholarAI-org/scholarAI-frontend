import type { OpportunityType, ScholarshipDetailsModel } from '../types';
import { getFundingLabel, getStudyLevelLabel, type CardFieldLabel } from './card-labels';
import { toSafeHref } from './safe-links';

// The factual summary only shows what the backend sent: a null, empty or blank
// field is left out. The deadline is the exception and always shows, using the
// card's no-deadline / not-specified rules.
export type DetailsFact =
  | {
      field: 'country' | 'provider' | 'university' | 'fundingAmount' | 'languageRequirements';
      kind: 'text';
      text: string;
    }
  | { field: 'studyLevel' | 'fundingType'; kind: 'label'; label: NonNullable<CardFieldLabel> }
  | { field: 'opportunityType'; kind: 'opportunity'; value: OpportunityType }
  | { field: 'deadline'; kind: 'deadline' }
  | { field: 'publishedAt'; kind: 'date'; value: Date }
  | { field: 'source'; kind: 'source'; text: string; href: string | null };

export type DetailsListField = 'majors' | 'eligibilityCriteria' | 'requiredDocuments';

export function getDetailsFacts(details: ScholarshipDetailsModel): DetailsFact[] {
  const facts: DetailsFact[] = [];
  const text = (
    field: 'country' | 'provider' | 'university' | 'fundingAmount' | 'languageRequirements',
    value: string | undefined
  ) => {
    if (value) facts.push({ field, kind: 'text', text: value });
  };
  const label = (field: 'studyLevel' | 'fundingType', value: CardFieldLabel) => {
    if (value) facts.push({ field, kind: 'label', label: value });
  };

  text('country', details.country);
  text('provider', details.organizationName);
  text('university', details.universityName);
  label('studyLevel', getStudyLevelLabel(details.studyLevel));
  label('fundingType', getFundingLabel(details.fundingType));
  if (details.opportunityType) {
    facts.push({ field: 'opportunityType', kind: 'opportunity', value: details.opportunityType });
  }
  facts.push({ field: 'deadline', kind: 'deadline' });
  text('fundingAmount', details.fundingAmount);
  text('languageRequirements', details.languageRequirements);
  const published = details.publishedAt ? new Date(details.publishedAt) : null;
  if (published && !Number.isNaN(published.getTime())) {
    facts.push({ field: 'publishedAt', kind: 'date', value: published });
  }
  const source = details.source?.trim();
  if (source) {
    facts.push({
      field: 'source',
      kind: 'source',
      text: source,
      href: toSafeHref(details.sourceUrl, ['http:', 'https:']),
    });
  }
  return facts;
}

// Non-empty lists only, in display order.
export function getDetailsLists(
  details: ScholarshipDetailsModel
): { field: DetailsListField; items: string[] }[] {
  return (['majors', 'eligibilityCriteria', 'requiredDocuments'] as const)
    .map((field) => ({ field, items: details[field] }))
    .filter((list) => list.items.length > 0);
}
