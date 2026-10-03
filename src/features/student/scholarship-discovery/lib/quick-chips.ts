import { academicLevels } from '../constants';
import type { AcademicLevel, DiscoveryFilterPatch, DiscoveryQuery } from '../types';
import { toggleValue } from './filter-values';

export type QuickChipId = 'all' | AcademicLevel;

// Mobile/tablet quick chips (Figma 3606:11301): "All" first, then one chip per
// academic level, bound to the same URL state as the academic-level checkboxes.
export const getQuickChips = (query: DiscoveryQuery) => [
  { id: 'all' as QuickChipId, pressed: query.academicLevels.length === 0 },
  ...academicLevels.map((level) => ({
    id: level as QuickChipId,
    pressed: query.academicLevels.includes(level),
  })),
];

export const quickChipPatch = (query: DiscoveryQuery, id: QuickChipId): DiscoveryFilterPatch =>
  id === 'all' ? { academicLevels: [] } : { academicLevels: toggleValue(query.academicLevels, id) };
