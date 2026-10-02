import type {
  AcademicLevel,
  DiscoveryQuery,
  DiscoverySort,
  FundingType,
  OpportunityType,
} from './types';
export const DISCOVERY_PAGE_SIZE = 20;
export const academicLevels: AcademicLevel[] = ['bachelor', 'master', 'phd', 'exchange'];
export const fundingTypes: FundingType[] = ['full', 'partial'];
export const opportunityTypes: OpportunityType[] = [
  'scholarship',
  'academic_exchange',
  'research_fellowship',
  'training',
];
export const discoverySorts: DiscoverySort[] = ['newest', 'deadline_soon'];
export const defaultDiscoveryQuery: DiscoveryQuery = {
  academicLevels: [],
  fundingTypes: [],
  opportunityTypes: [],
  countries: [],
  sort: 'newest',
  page: 1,
};
