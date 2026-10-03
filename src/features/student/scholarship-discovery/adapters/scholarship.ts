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
  const items = typeof value === 'string' ? value.split(/\r?\n/) : (value ?? []);
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
