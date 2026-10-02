import type {
  AcademicLevel,
  DiscoveryQuery,
  DiscoverySort,
  DiscoverySortOption,
  FundingType,
  OpportunityType,
} from './types';
export const DISCOVERY_PAGE_SIZE = 20;
// Request limits from GET /api/scholarships/ in docs/api/openapi.json.
export const DISCOVERY_LIMITS = {
  searchMaxLength: 300,
  countryMaxLength: 100,
  countryMaxItems: 50,
  filterMaxItems: 20,
} as const;
export const academicLevels: AcademicLevel[] = ['bachelor', 'master', 'phd', 'exchange'];
export const fundingTypes: FundingType[] = ['full', 'partial'];
export const opportunityTypes: OpportunityType[] = [
  'scholarship',
  'academic_exchange',
  'research_fellowship',
  'training',
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
