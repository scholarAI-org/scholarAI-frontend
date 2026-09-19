export type ManualScholarshipCreatePayload = {
  ingestion_type: 'manual';
  title_ar: string;
  title_en: string;
  organization_name: string;
  country: string;
  university_name?: string | null;
  study_level: string;
  funding_type: string;
  funding_amount?: string | null;
  deadline: string | null;
  no_deadline: boolean;
  majors?: string[] | null;
  language_requirements?: string[] | null;
  eligibility_criteria?: string[] | null;
  required_documents?: string[] | null;
  apply_link: string;
  image_url: string;
  source_url?: string | null;
  description_html?: string | null;
  apply_email?: string | null;
  apply_phone?: string | null;
};

/**
 * The finalized request contract does not prescribe a response body. Preserve
 * common fields without claiming a stricter response than the endpoint offers.
 */
export type ManualScholarshipCreateResponse = Record<string, unknown> & {
  id?: number;
  status?: string;
};
