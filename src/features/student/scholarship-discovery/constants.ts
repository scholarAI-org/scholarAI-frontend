import type {
  AcademicLevel,
  DiscoveryQuery,
  DiscoverySort,
  DiscoverySortOption,
  FundingType,
  OpportunityType,
  StudyLevel,
} from './types';
export const DISCOVERY_PAGE_SIZE = 20;
// Request limits from GET /api/scholarships/ in docs/api/openapi.json.
export const DISCOVERY_LIMITS = {
  searchMaxLength: 300,
  countryMaxLength: 100,
  countryMaxItems: 50,
  filterMaxItems: 20,
} as const;
export const academicLevels: AcademicLevel[] = ['bachelor', 'master', 'phd', 'postdoc'];
// Every stored level has a label; `other` is not offered as a filter.
export const studyLevels: StudyLevel[] = [...academicLevels, 'other'];
export const fundingTypes: FundingType[] = ['full', 'partial'];
export const opportunityTypes: OpportunityType[] = [
  'scholarship',
  'fellowship',
  'grant',
  'exchange',
  'short_course',
  'other',
];
// A future `match` option is added here with `available: false` until its backend contract exists.
export const discoverySortOptions: DiscoverySortOption<DiscoverySort>[] = [
  { value: 'newest', labelKey: 'sort.newest', available: true },
  { value: 'deadline_soon', labelKey: 'sort.deadlineSoon', available: true },
];
export const getVisibleSortOptions = <V extends string>(
  options: readonly DiscoverySortOption<V>[]
) => options.filter((option) => option.available);
export const discoverySorts: DiscoverySort[] = getVisibleSortOptions(discoverySortOptions).map(
  (option) => option.value
);
export const defaultDiscoveryQuery: DiscoveryQuery = {
  academicLevels: [],
  fundingTypes: [],
  opportunityTypes: [],
  countries: [],
  sort: 'newest',
  page: 1,
};
