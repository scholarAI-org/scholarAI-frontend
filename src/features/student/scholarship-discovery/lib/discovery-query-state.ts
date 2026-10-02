import { academicLevels, discoverySorts, fundingTypes, opportunityTypes } from '../constants';
import type { DiscoveryQuery } from '../types';
const many = <T extends string>(values: string[], allowed: readonly T[]) => [
  ...new Set(
    values.map((v) => v.trim().toLowerCase()).filter((v): v is T => allowed.includes(v as T))
  ),
];
export function parseDiscoveryQuery(p: URLSearchParams): DiscoveryQuery {
  const raw = p.get('sort');
  const sort =
    raw === 'deadline_soonest'
      ? 'deadline_soon'
      : discoverySorts.includes(raw as 'newest' | 'deadline_soon')
        ? (raw as 'newest' | 'deadline_soon')
        : 'newest';
  const n = Number(p.get('page'));
  return {
    search: p.get('search')?.trim().replace(/\s+/g, ' ') || undefined,
    academicLevels: many(p.getAll('academic_level'), academicLevels),
    fundingTypes: many(p.getAll('funding_type'), fundingTypes),
    opportunityTypes: many(p.getAll('opportunity_type'), opportunityTypes),
    countries: [
      ...new Set(
        p
          .getAll('country')
          .map((v) => v.trim())
          .filter(Boolean)
      ),
    ],
    sort,
    page: Number.isInteger(n) && n > 0 ? n : 1,
  };
}
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
