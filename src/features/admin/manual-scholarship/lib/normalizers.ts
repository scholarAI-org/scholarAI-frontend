import type { ManualScholarshipFormValues } from '../schemas/manual-scholarship.schema';
import type { ManualScholarshipCreatePayload } from '../types';

export function toOptionalTrimmedString(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function toTrimmedLines(value: string | null | undefined): string[] | null {
  const values = value
    ?.split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return values?.length ? values : null;
}

export function normalizeDeadline(noDeadline: boolean, deadline: string | null | undefined) {
  return noDeadline ? null : deadline?.trim() || null;
}

export function toManualScholarshipCreatePayload(
  values: ManualScholarshipFormValues
): ManualScholarshipCreatePayload {
  return {
    ingestion_type: 'manual',
    title_ar: values.title_ar.trim(),
    title_en: values.title_en.trim(),
    organization_name: values.organization_name.trim(),
    country: values.country.trim(),
    university_name: toOptionalTrimmedString(values.university_name),
    study_level: values.study_level.trim(),
    funding_type: values.funding_type.trim(),
    funding_amount: toOptionalTrimmedString(values.funding_amount),
    deadline: normalizeDeadline(values.no_deadline, values.deadline),
    no_deadline: values.no_deadline,
    majors: toTrimmedLines(values.majors),
    language_requirements: toTrimmedLines(values.language_requirements),
    eligibility_criteria: toTrimmedLines(values.eligibility_criteria),
    required_documents: toTrimmedLines(values.required_documents),
    apply_link: (values.apply_link ?? '').trim(),
    image_url: (values.image_url ?? '').trim(),
    source_url: toOptionalTrimmedString(values.source_url),
    description_html: toOptionalTrimmedString(values.description_html),
    apply_email: toOptionalTrimmedString(values.apply_email),
    apply_phone: toOptionalTrimmedString(values.apply_phone),
  };
}
