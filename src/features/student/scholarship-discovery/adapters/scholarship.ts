import type { ScholarshipCardModel, ScholarshipDiscoveryCard } from '../types';
const clean = (value?: string | null) => value?.trim() || undefined;
export function toScholarshipCard(
  item: ScholarshipDiscoveryCard,
  locale: string
): ScholarshipCardModel {
  return {
    id: item.id,
    title: clean(locale === 'ar' ? item.title_ar : item.title_en) || clean(item.title) || '—',
    organizationName: clean(item.organization_name),
    universityName: clean(item.university_name),
    country: clean(item.country),
    studyLevel: clean(item.study_level),
    fundingType: clean(item.funding_type),
    opportunityType: clean(item.opportunity_type),
    imageUrl: clean(item.image_url),
    deadline: clean(item.deadline),
    noDeadline: Boolean(item.no_deadline),
    isSaved: item.is_saved,
    match: null,
  };
}
