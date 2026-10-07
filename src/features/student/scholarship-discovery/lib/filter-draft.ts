import type { DiscoveryFilterPatch, DiscoveryQuery } from '../types';

// The mobile filters dialog edits a local copy of the URL filters. Applying sends
// the whole draft as one filter patch (one history entry, page reset); closing
// without applying simply drops it.
export type FilterDraft = Required<DiscoveryFilterPatch>;

type FilterSource = Pick<
  DiscoveryQuery,
  'academicLevels' | 'fundingTypes' | 'opportunityTypes' | 'countries'
>;

export const createFilterDraft = (source: FilterSource): FilterDraft => ({
  academicLevels: [...source.academicLevels],
  fundingTypes: [...source.fundingTypes],
  opportunityTypes: [...source.opportunityTypes],
  countries: [...source.countries],
});

export const emptyFilterDraft = (): FilterDraft => ({
  academicLevels: [],
  fundingTypes: [],
  opportunityTypes: [],
  countries: [],
});

// Every selected value counts: two levels and one country are 3 active filters.
export const countActiveFilters = (source: FilterSource) =>
  source.academicLevels.length +
  source.fundingTypes.length +
  source.opportunityTypes.length +
  source.countries.length;
