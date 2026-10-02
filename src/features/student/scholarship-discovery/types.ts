export type DiscoverySort = 'newest' | 'deadline_soon';
export type AcademicLevel = 'bachelor' | 'master' | 'phd' | 'exchange';
export type FundingType = 'full' | 'partial';
export type OpportunityType =
  'scholarship' | 'academic_exchange' | 'research_fellowship' | 'training';
export interface DiscoveryQuery {
  search?: string;
  academicLevels: AcademicLevel[];
  fundingTypes: FundingType[];
  opportunityTypes: OpportunityType[];
  countries: string[];
  sort: DiscoverySort;
  page: number;
}
export interface ScholarshipDiscoveryFilterOptionsResponse {
  countries: string[];
}
export interface ScholarshipDiscoveryCard {
  id: number;
  title: string;
  title_ar?: string | null;
  title_en?: string | null;
  organization_name?: string | null;
  university_name?: string | null;
  country?: string | null;
  study_level?: string | null;
  funding_type?: string | null;
  opportunity_type?: string | null;
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
export interface ScholarshipMatchInfo {
  matchScore?: number | null;
  matchLevel?: 'high' | 'medium' | 'low' | null;
  matchReasons?: string[];
  matchCoverage?: number | null;
  eligibilityStatus?: string | null;
}
export interface ScholarshipCardModel {
  id: number;
  title: string;
  organizationName?: string;
  universityName?: string;
  country?: string;
  studyLevel?: string;
  fundingType?: string;
  opportunityType?: string;
  imageUrl?: string;
  deadline?: string;
  noDeadline: boolean;
  isSaved: boolean;
  match?: ScholarshipMatchInfo | null;
}
export type ScholarshipDetailsResponse = ScholarshipDiscoveryCard;
