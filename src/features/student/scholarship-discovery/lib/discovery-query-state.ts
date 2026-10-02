import {
  academicLevels,
  DISCOVERY_LIMITS,
  DISCOVERY_PAGE_SIZE,
  discoverySorts,
  fundingTypes,
  opportunityTypes,
} from '../constants';
import type { DiscoveryFilterPatch, DiscoveryQuery, DiscoverySort } from '../types';
const many = <T extends string>(values: readonly string[], allowed: readonly T[]) =>
  [
    ...new Set(
      values.map((v) => v.trim().toLowerCase()).filter((v): v is T => allowed.includes(v as T))
    ),
  ].slice(0, DISCOVERY_LIMITS.filterMaxItems);
// Over-long countries are dropped, not truncated: the backend matches exact names.
const countryList = (values: readonly string[]) =>
  [
    ...new Set(
      values.map((v) => v.trim()).filter((v) => v && v.length <= DISCOVERY_LIMITS.countryMaxLength)
    ),
  ].slice(0, DISCOVERY_LIMITS.countryMaxItems);
const searchText = (value?: string | null) =>
  value?.replace(/\s+/g, ' ').trim().slice(0, DISCOVERY_LIMITS.searchMaxLength).trim() || undefined;
const sortValue = (value?: string | null): DiscoverySort =>
  value === 'deadline_soonest'
    ? 'deadline_soon'
    : discoverySorts.includes(value as DiscoverySort)
      ? (value as DiscoverySort)
      : 'newest';
const pageNumber = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 1;
};
interface RawDiscoveryQuery {
  search?: string | null;
  academicLevels?: readonly string[];
  fundingTypes?: readonly string[];
  opportunityTypes?: readonly string[];
  countries?: readonly string[];
  sort?: string | null;
  page?: unknown;
}
export function normalizeDiscoveryQuery(raw: RawDiscoveryQuery): DiscoveryQuery {
  const query: DiscoveryQuery = {
    academicLevels: many(raw.academicLevels ?? [], academicLevels),
    fundingTypes: many(raw.fundingTypes ?? [], fundingTypes),
    opportunityTypes: many(raw.opportunityTypes ?? [], opportunityTypes),
    countries: countryList(raw.countries ?? []),
    sort: sortValue(raw.sort),
    page: pageNumber(raw.page),
  };
  const search = searchText(raw.search);
  return search ? { search, ...query } : query;
}
export const parseDiscoveryQuery = (p: URLSearchParams): DiscoveryQuery =>
  normalizeDiscoveryQuery({
    search: p.get('search'),
    academicLevels: p.getAll('academic_level'),
    fundingTypes: p.getAll('funding_type'),
    opportunityTypes: p.getAll('opportunity_type'),
    countries: p.getAll('country'),
    sort: p.get('sort'),
    page: p.get('page'),
  });
// Browser URL state: defaults omitted, page_size never included.
export function serializeDiscoveryQuery(q: DiscoveryQuery) {
  const p = new URLSearchParams();
  if (q.search) p.set('search', q.search);
  q.academicLevels.forEach((v) => p.append('academic_level', v));
  q.fundingTypes.forEach((v) => p.append('funding_type', v));
  q.opportunityTypes.forEach((v) => p.append('opportunity_type', v));
  q.countries.forEach((v) => p.append('country', v));
  if (q.sort !== 'newest') p.set('sort', q.sort);
  if (q.page > 1) p.set('page', String(q.page));
  return p;
}
// Backend request: explicit sort and page plus the fixed page size.
export function toDiscoveryRequestParams(q: DiscoveryQuery) {
  const p = serializeDiscoveryQuery(q);
  p.set('sort', q.sort);
  p.set('page', String(q.page));
  p.set('page_size', String(DISCOVERY_PAGE_SIZE));
  return p;
}
export const withSearch = (q: DiscoveryQuery, search: string) =>
  normalizeDiscoveryQuery({ ...q, search, page: 1 });
export const withFilterChange = (q: DiscoveryQuery, patch: DiscoveryFilterPatch) =>
  normalizeDiscoveryQuery({ ...q, ...patch, page: 1 });
export const withSort = (q: DiscoveryQuery, sort: DiscoverySort) =>
  normalizeDiscoveryQuery({ ...q, sort, page: 1 });
export const withPage = (q: DiscoveryQuery, page: number) =>
  normalizeDiscoveryQuery({ ...q, page });
export function buildDiscoveryHref(pathname: string, q: DiscoveryQuery) {
  const search = serializeDiscoveryQuery(q).toString();
  return search ? `${pathname}?${search}` : pathname;
}
