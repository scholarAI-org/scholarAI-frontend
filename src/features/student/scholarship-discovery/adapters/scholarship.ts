import { opportunityTypes } from '../constants';
import type {
  OpportunityType,
  ScholarshipCardModel,
  ScholarshipDetailsModel,
  ScholarshipDetailsResponse,
  ScholarshipDiscoveryCard,
} from '../types';
// Tolerate wrongly typed optional fields: anything but a non-blank string is absent.
const clean = (value: unknown) => (typeof value === 'string' && value.trim()) || undefined;
// Backend text fields may be an array or one newline-separated string.
export function toStringList(value?: readonly unknown[] | string | null): string[] {
  const items =
    typeof value === 'string' ? value.split(/\r?\n/) : Array.isArray(value) ? value : [];
  return items.flatMap((item) => (typeof item === 'string' && item.trim() ? [item.trim()] : []));
}
export function toScholarshipCard(
  item: ScholarshipDiscoveryCard,
  locale: string
): ScholarshipCardModel {
  return {
    id: item.id,
    title: clean(locale === 'ar' ? item.title_ar : item.title_en) || clean(item.title),
    organizationName: clean(item.organization_name),
    universityName: clean(item.university_name),
    country: clean(item.country),
    studyLevel: clean(item.study_level),
    fundingType: clean(item.funding_type),
    opportunityType: opportunityTypes.includes(item.opportunity_type as OpportunityType)
      ? (item.opportunity_type as OpportunityType)
      : undefined,
    imageUrl: clean(item.image_url),
    deadline: clean(item.deadline),
    noDeadline: item.no_deadline === true,
    isSaved: item.is_saved,
    match: null,
  };
}
export type ScholarshipCardEntry =
  { kind: 'card'; card: ScholarshipCardModel } | { kind: 'malformed'; key: string };
// A card needs a positive integer id, a string title and a boolean is_saved
// (required by OpenAPI). Anything else is skipped and reported, not rendered.
export function isDiscoveryCardShape(item: unknown): item is ScholarshipDiscoveryCard {
  if (!item || typeof item !== 'object') return false;
  const card = item as Record<string, unknown>;
  return (
    Number.isInteger(card.id) &&
    (card.id as number) > 0 &&
    typeof card.title === 'string' &&
    typeof card.is_saved === 'boolean'
  );
}
export const toScholarshipCardEntries = (
  items: readonly unknown[],
  locale: string
): ScholarshipCardEntry[] =>
  items.map((item, index) =>
    isDiscoveryCardShape(item)
      ? { kind: 'card', card: toScholarshipCard(item, locale) }
      : { kind: 'malformed', key: `malformed-${index}` }
  );
export function toScholarshipDetails(
  item: ScholarshipDetailsResponse,
  locale: string
): ScholarshipDetailsModel {
  return {
    ...toScholarshipCard(item, locale),
    ingestionType: item.ingestion_type,
    source: item.source,
    sourceUrl: clean(item.source_url),
    fundingAmount: clean(item.funding_amount),
    languageRequirements: clean(item.language_requirements),
    majors: toStringList(item.majors),
    eligibilityCriteria: toStringList(item.eligibility_criteria),
    requiredDocuments: toStringList(item.required_documents),
    applyLink: clean(item.apply_link),
    applyEmail: clean(item.apply_email),
    applyPhone: clean(item.apply_phone),
    pdfUrl: clean(item.pdf_url),
    attachments: toStringList(item.attachments),
    isExtension: item.is_extension === true,
    publishedAt: clean(item.published_at),
  };
}
