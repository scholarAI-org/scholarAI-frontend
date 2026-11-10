import { getApplyLinks, toSafeHref } from '@/features/student/scholarship-discovery/lib/safe-links';
import {
  scholarshipDetailViewSchema,
  type ScholarshipDetailViewData,
} from '../schemas/detail-view.schema';
import type { ScholarshipDetailsViewModel } from '../types';
import { DetailsContractError, type DetailsContractErrorReason } from './adapter';

const REASON_BY_FIELD: Record<string, DetailsContractErrorReason> = {
  id: 'invalid-id',
  title: 'missing-title',
  is_saved: 'missing-is-saved',
};

// GET /api/scholarships/{id}/details: validated before it reaches the query cache.
export function parseScholarshipDetailView(raw: unknown): ScholarshipDetailViewData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DetailsContractError('not-object');
  }
  const result = scholarshipDetailViewSchema.safeParse(raw);
  if (!result.success) {
    const field = String(result.error.issues[0]?.path[0] ?? '');
    throw new DetailsContractError(REASON_BY_FIELD[field] ?? 'not-object');
  }
  return result.data;
}

const WEB_PROTOCOLS = ['http:', 'https:'];
const webLink = (value: string | undefined) => toSafeHref(value, WEB_PROTOCOLS) ?? undefined;
const LIST_SEPARATOR: Record<string, string> = { ar: '، ' };

// Same view model as the older endpoint, so the page renders both. The backend has
// already chosen the language; `locale` only joins lists with the right separator.
export function toDetailsViewFromDetailView(
  data: ScholarshipDetailViewData,
  locale: string
): ScholarshipDetailsViewModel {
  const { provider, deadline, overview, funding, eligibility, application, source } = data;
  const links = getApplyLinks({
    applyLink: application.link,
    applyEmail: application.email,
    applyPhone: application.phone,
  });
  const link = (kind: 'link' | 'email' | 'phone') => links.find((entry) => entry.kind === kind);
  const countries = (overview.countries ?? []).map((country) => country.name);

  return {
    id: data.id,
    title: data.title.trim() || data.title,
    isSaved: data.is_saved,
    organizationName: provider.name,
    universityName: provider.university,
    country: countries.length > 0 ? countries.join(LIST_SEPARATOR[locale] ?? ', ') : undefined,
    description: overview.description,
    imageUrl: data.image_url,
    studyLevels: overview.study_levels ?? [],
    fundingType: funding.type,
    opportunityType: overview.opportunity_type,
    applicationStatus: deadline.status ?? 'unknown',
    deadline: deadline.date,
    noDeadline: deadline.no_deadline ?? false,
    openingDate: deadline.opening_date,
    publishedAt: source.published_at,
    lastUpdatedAt: data.last_updated_at,
    source: source.name,
    sourceUrl: webLink(source.url),
    fundingSummary: funding.summary,
    fundingDuration: funding.duration_months,
    benefits: funding.benefits ?? [],
    languageRequirements: eligibility.summary.languages,
    eligibleNationalities: eligibility.summary.nationalities,
    academicYear: overview.academic_year,
    gpaRequirement: eligibility.summary.gpa,
    ageRequirement: eligibility.summary.age,
    majors: (overview.fields_of_study ?? []).map((field) => field.name),
    fieldsOfStudyScope: overview.fields_of_study_scope,
    eligibilityCriteria: eligibility.criteria ?? [],
    requiredDocuments: application.documents ?? [],
    apply: {
      ...(link('link') ? { link: link('link')!.href } : {}),
      ...(link('email') ? { email: link('email')!.href } : {}),
      ...(link('phone') ? { phone: link('phone')!.href } : {}),
    },
    applyText: {
      ...(link('email') ? { email: link('email')!.text } : {}),
      ...(link('phone') ? { phone: link('phone')!.text } : {}),
    },
    pdfUrl: webLink(application.pdf_url),
    attachments: (application.attachments ?? []).flatMap((entry) => webLink(entry) ?? []),
    isExtension: false,
  };
}
