export type DiscoverySort = 'newest' | 'deadline_soon';
export type AcademicLevel = 'bachelor' | 'master' | 'phd' | 'exchange';
export type FundingType = 'full' | 'partial';
export type OpportunityType =
  'scholarship' | 'academic_exchange' | 'research_fellowship' | 'training';
export type ScholarshipIngestionType = 'scraped' | 'manual';
// Presentation only: never part of the URL, query keys or storage.
export type DiscoveryView = 'grid' | 'list';
export interface DiscoveryQuery {
  search?: string;
  academicLevels: AcademicLevel[];
  fundingTypes: FundingType[];
  opportunityTypes: OpportunityType[];
  countries: string[];
  sort: DiscoverySort;
  page: number;
}
export type DiscoveryFilterPatch = Partial<
  Pick<DiscoveryQuery, 'academicLevels' | 'fundingTypes' | 'opportunityTypes' | 'countries'>
>;
export interface DiscoverySortOption<V extends string = string> {
  value: V;
  labelKey: string;
  available: boolean;
}
export interface ScholarshipDiscoveryFilterOptionsResponse {
  countries: string[];
}
export interface ScholarshipDiscoveryCard {
  id: number;
  title: string;
  title_ar?: string | null;
  title_en?: string | null;
  slug?: string | null;
  organization_name?: string | null;
  university_name?: string | null;
  country?: string | null;
  study_level?: string | null;
  funding_type?: string | null;
  opportunity_type?: OpportunityType | null;
  image_url?: string | null;
  deadline?: string | null;
  no_deadline?: boolean | null;
  is_saved: boolean;
}
export interface ScholarshipDiscoveryResponse {
  items: ScholarshipDiscoveryCard[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
type ListOrString = string[] | string | null;
// Mirrors ScholarshipDetailsResponse in docs/api/openapi.json.
export interface ScholarshipDetailsResponse extends ScholarshipDiscoveryCard {
  ingestion_type: ScholarshipIngestionType;
  source: string;
  source_url?: string | null;
  description_html?: string | null;
  funding_amount?: string | null;
  language_requirements?: string | null;
  majors?: ListOrString;
  eligibility_criteria?: ListOrString;
  required_documents?: ListOrString;
  apply_link?: string | null;
  apply_email?: string | null;
  apply_phone?: string | null;
  pdf_url?: string | null;
  attachments?: string[] | null;
  is_extension?: boolean | null;
  published_at?: string | null;
}
export interface SavedScholarshipResponse {
  id: number;
  user_id: number;
  scholarship_id: number;
  created_at: string;
  is_saved?: boolean;
  message?: string;
}
export interface UnsaveScholarshipResponse {
  scholarship_id: number;
  is_saved?: boolean;
  message?: string;
}
export interface ScholarshipMatchInfo {
  score?: number | null;
  level?: 'high' | 'medium' | 'low' | null;
  reasons?: string[];
  coverage?: number | null;
}
export interface ScholarshipCardModel {
  id: number;
  title?: string;
  organizationName?: string;
  universityName?: string;
  country?: string;
  studyLevel?: string;
  fundingType?: string;
  opportunityType?: OpportunityType;
  imageUrl?: string;
  deadline?: string;
  noDeadline: boolean;
  isSaved: boolean;
  match?: ScholarshipMatchInfo | null;
}
// description_html is intentionally not carried: Feature 005 never renders it.
export interface ScholarshipDetailsModel extends ScholarshipCardModel {
  ingestionType: ScholarshipIngestionType;
  source: string;
  sourceUrl?: string;
  fundingAmount?: string;
  languageRequirements?: string;
  majors: string[];
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  applyLink?: string;
  applyEmail?: string;
  applyPhone?: string;
  pdfUrl?: string;
  attachments: string[];
  isExtension: boolean;
  publishedAt?: string;
}
