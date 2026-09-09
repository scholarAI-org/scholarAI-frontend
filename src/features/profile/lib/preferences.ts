import type { PreferencesApi } from '../schemas/preferences-api.schema';
import type { PreferencesForm } from '../schemas/preferences.schema';

export function getPreferencesCompletion(form: PreferencesForm | PreferencesApi): number {
  let completed = 0;
  const total = 4;

  if (form.desired_degree_level) completed++;
  if (
    ('target_field_of_study' in form && form.target_field_of_study) ||
    ('target_field_of_study_openalex_id' in form && form.target_field_of_study_openalex_id)
  )
    completed++;
  if (form.funding_type) completed++;
  if (form.preferred_countries && form.preferred_countries.length > 0) completed++;

  return Math.round((completed / total) * 100);
}

export function toPreferencesForm(dto: PreferencesApi): PreferencesForm {
  return {
    desired_degree_level: dto.desired_degree_level ?? undefined,
    target_field_of_study: dto.target_field_of_study ?? undefined,
    target_field_of_study_openalex_id: dto.target_field_of_study_openalex_id ?? undefined,
    detailed_specialization: dto.detailed_specialization ?? undefined,
    funding_type: dto.funding_type ?? undefined,
    preferred_countries: dto.preferred_countries ?? [],
    open_to_all_countries: dto.open_to_all_countries ?? false,
    is_profile_completed: dto.is_profile_completed ?? false,
  };
}

export function toPreferencesDto(form: PreferencesForm): PreferencesApi {
  return {
    desired_degree_level: form.desired_degree_level || null,
    target_field_of_study: form.target_field_of_study || null,
    target_field_of_study_openalex_id: form.target_field_of_study_openalex_id || null,
    detailed_specialization:
      form.desired_degree_level === 'PHD' ? form.detailed_specialization || null : null,
    funding_type: form.funding_type || null,
    preferred_countries: form.preferred_countries || [],
    open_to_all_countries: form.open_to_all_countries ?? false,
    is_profile_completed: form.is_profile_completed || false,
  };
}
