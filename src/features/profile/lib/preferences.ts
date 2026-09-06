import type { PreferencesApi } from '../schemas/preferences-api.schema';
import type { PreferencesForm } from '../schemas/preferences.schema';

export function getPreferencesCompletion(form: PreferencesForm | PreferencesApi): number {
  let completed = 0;
  const total = 4;

  if (form.desired_degree_level) completed++;
  if (form.funding_type) completed++;
  if (form.preferred_fields_of_study && form.preferred_fields_of_study.length > 0) completed++;
  if (form.preferred_countries && form.preferred_countries.length > 0) completed++;

  return Math.round((completed / total) * 100);
}

export function toPreferencesForm(dto: PreferencesApi): PreferencesForm {
  return {
    desired_degree_level: dto.desired_degree_level ?? undefined,
    funding_type: dto.funding_type ?? undefined,
    preferred_fields_of_study: dto.preferred_fields_of_study ?? [],
    preferred_countries: dto.preferred_countries ?? [],
    is_profile_completed: dto.is_profile_completed ?? false,
  };
}

export function toPreferencesDto(form: PreferencesForm): PreferencesApi {
  return {
    desired_degree_level: form.desired_degree_level || null,
    funding_type: form.funding_type || null,
    preferred_fields_of_study: form.preferred_fields_of_study || [],
    preferred_countries: form.preferred_countries || [],
    is_profile_completed: form.is_profile_completed || false,
  };
}
