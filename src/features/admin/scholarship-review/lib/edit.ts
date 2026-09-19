import type { AdminScholarshipUpdatePayload, ScholarshipReviewDetail } from '../types';

export type ScholarshipEditValues = {
  title: string;
  organization_name: string;
  country: string;
  deadline: string;
  no_deadline: boolean;
  apply_link: string;
  image_url: string;
  required_documents: string;
  eligibility_criteria: string;
  description_html: string;
};

const asText = (value: string | null | undefined) => value ?? '';
const asLines = (value: string[] | string | null | undefined) =>
  (Array.isArray(value) ? value : value ? [value] : []).join('\n');
const cleanLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
const nullableText = (value: string) => value.trim() || null;

export function toScholarshipEditValues(detail: ScholarshipReviewDetail): ScholarshipEditValues {
  return {
    title: asText(detail.title),
    organization_name: asText(detail.organization_name),
    country: asText(detail.country),
    deadline: asText(detail.deadline),
    no_deadline: Boolean(detail.no_deadline),
    apply_link: asText(detail.apply_link),
    image_url: asText(detail.image_url),
    required_documents: asLines(detail.required_documents),
    eligibility_criteria: asLines(detail.eligibility_criteria),
    description_html: asText(detail.description_html),
  };
}

/** PATCH only contains changed, writable fields so unavailable detail fields are never cleared. */
export function toChangedScholarshipUpdate(
  values: ScholarshipEditValues,
  initial: ScholarshipEditValues
): AdminScholarshipUpdatePayload {
  const result: AdminScholarshipUpdatePayload = {};
  if (values.title.trim() !== initial.title.trim()) result.title = nullableText(values.title);
  if (values.organization_name.trim() !== initial.organization_name.trim())
    result.organization_name = nullableText(values.organization_name);
  if (values.country.trim() !== initial.country.trim())
    result.country = nullableText(values.country);
  if (values.no_deadline !== initial.no_deadline) result.no_deadline = values.no_deadline;
  if (!values.no_deadline && values.deadline.trim() !== initial.deadline.trim())
    result.deadline = nullableText(values.deadline);
  if (values.no_deadline && initial.deadline) result.deadline = null;
  if (values.apply_link.trim() !== initial.apply_link.trim())
    result.apply_link = nullableText(values.apply_link);
  if (values.image_url.trim() !== initial.image_url.trim())
    result.image_url = nullableText(values.image_url);
  if (values.description_html.trim() !== initial.description_html.trim())
    result.description_html = nullableText(values.description_html);
  if (values.required_documents !== initial.required_documents)
    result.required_documents = cleanLines(values.required_documents);
  if (values.eligibility_criteria !== initial.eligibility_criteria)
    result.eligibility_criteria = cleanLines(values.eligibility_criteria);
  return result;
}

export function isHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
