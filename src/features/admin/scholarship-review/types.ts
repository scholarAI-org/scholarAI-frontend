export type ScholarshipReviewStatistics = {
  pending_count: number;
  approved_this_week: number;
  reviewed_this_week: number;
  missing_source_url_count: number;
};

export type ScholarshipReviewItem = {
  id: number;
  title: string;
  organization_name: string | null;
  source: string;
  source_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  scraped_at: string | null;
};

export type ScholarshipReviewListResponse = {
  items: ScholarshipReviewItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ScholarshipReviewDetail = {
  id: number;
  title: string;
  title_ar?: string | null;
  title_en?: string | null;
  organization_name?: string | null;
  university_name?: string | null;
  country?: string | null;
  ingestion_type?: 'manual' | 'scraped' | null;
  status?: string | null;
  scraped_at?: string | null;
  source?: string | null;
  source_url?: string | null;
  apply_link?: string | null;
  image_url?: string | null;
  funding_type?: string | null;
  funding_amount?: string | null;
  deadline?: string | null;
  no_deadline?: boolean | null;
  majors?: string[] | string | null;
  description_html?: string | null;
  eligibility_criteria?: string[] | string | null;
  required_documents?: string[] | string | null;
};

/** The deployed PATCH contract deliberately excludes workflow and source-owned fields. */
export type AdminScholarshipUpdatePayload = {
  title?: string | null;
  organization_name?: string | null;
  country?: string | null;
  deadline?: string | null;
  no_deadline?: boolean | null;
  image_url?: string | null;
  description_html?: string | null;
  apply_link?: string | null;
  required_documents?: string[] | null;
  eligibility_criteria?: string[] | null;
};

export type ScholarshipApproveResponse = {
  id: number;
  title: string;
  status?: string;
  message?: string;
};
export type ScholarshipRejectResponse = {
  id: number;
  title: string;
  status?: string;
  rejection_reason: string;
  message?: string;
};
