import { getApplyLinks, toSafeHref } from '@/features/student/scholarship-discovery/lib/safe-links';
import { scholarshipDetailsSchema, type ScholarshipDetailsData } from '../schemas/details.schema';
import type { ScholarshipDetailsViewModel } from '../types';

export type DetailsContractErrorReason =
  'not-object' | 'invalid-id' | 'missing-title' | 'missing-is-saved';

// A response that does not match the contract. It is an error state, never an
// empty success, and its reason is not user-visible copy.
export class DetailsContractError extends Error {
  readonly reason: DetailsContractErrorReason;
  constructor(reason: DetailsContractErrorReason) {
    super(`DetailsContractError: ${reason}`);
    this.name = 'DetailsContractError';
    this.reason = reason;
  }
}

const REASON_BY_FIELD: Record<string, DetailsContractErrorReason> = {
  id: 'invalid-id',
  title: 'missing-title',
  is_saved: 'missing-is-saved',
};

// The single entry point for the details response: validates with the zod
// schema and returns the normalised payload (this is what the query caches).
export function parseScholarshipDetails(raw: unknown): ScholarshipDetailsData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DetailsContractError('not-object');
  }
  const result = scholarshipDetailsSchema.safeParse(raw);
  if (!result.success) {
    const field = String(result.error.issues[0]?.path[0] ?? '');
    throw new DetailsContractError(REASON_BY_FIELD[field] ?? 'not-object');
  }
  return result.data;
}

const WEB_PROTOCOLS = ['http:', 'https:'];
const webLink = (value: string | undefined) => toSafeHref(value, WEB_PROTOCOLS) ?? undefined;

// Maps the normalised payload to what the page renders. Pure: no I/O, no clock.
export function toDetailsView(
  data: ScholarshipDetailsData,
  locale: string
): ScholarshipDetailsViewModel {
  const links = getApplyLinks({
    applyLink: data.apply_link,
    applyEmail: data.apply_email,
    applyPhone: data.apply_phone,
  });
  const link = (kind: 'link' | 'email' | 'phone') => links.find((entry) => entry.kind === kind);
  return {
    id: data.id,
    title: (locale === 'ar' ? data.title_ar : data.title_en) ?? (data.title.trim() || data.title),
    isSaved: data.is_saved,
    organizationName: data.organization_name,
    universityName: data.university_name,
    country: data.country,
    imageUrl: data.image_url,
    studyLevels: data.study_level ?? [],
    fundingType: data.funding_type,
    opportunityType: data.opportunity_type,
    applicationStatus: data.application_status ?? 'unknown',
    deadline: data.deadline,
    noDeadline: data.no_deadline ?? false,
    openingDate: data.opening_date,
    publishedAt: data.published_at,
    source: data.source,
    sourceUrl: webLink(data.source_url),
    fundingAmount: data.funding_amount,
    languageRequirements: data.language_requirements,
    eligibleNationalities: data.eligible_nationalities,
    academicYear: data.academic_year,
    gpaRequirement: data.gpa_requirement,
    ageRequirement: data.age_requirement,
    majors: data.majors ?? [],
    eligibilityCriteria: data.eligibility_criteria ?? [],
    requiredDocuments: data.required_documents ?? [],
    apply: {
      ...(link('link') ? { link: link('link')!.href } : {}),
      ...(link('email') ? { email: link('email')!.href } : {}),
      ...(link('phone') ? { phone: link('phone')!.href } : {}),
    },
    applyText: {
      ...(link('email') ? { email: link('email')!.text } : {}),
      ...(link('phone') ? { phone: link('phone')!.text } : {}),
    },
    pdfUrl: webLink(data.pdf_url),
    attachments: (data.attachments ?? []).flatMap((entry) => webLink(entry) ?? []),
    isExtension: data.is_extension ?? false,
  };
}
