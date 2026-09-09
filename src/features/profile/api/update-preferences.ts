import { apiClient } from '@/lib/api-client';
import { getProfileAuthHeaders } from './profile-auth';
import { type PreferencesApi, normalizePreferences } from '../schemas/preferences-api.schema';

export async function updatePreferences(data: PreferencesApi): Promise<PreferencesApi> {
  const payload = {
    desired_degree_level: data.desired_degree_level,
    target_field_of_study: data.target_field_of_study,
    target_field_of_study_openalex_id: data.target_field_of_study_openalex_id,
    detailed_specialization:
      data.desired_degree_level === 'PHD' ? data.detailed_specialization : null,
    funding_type: data.funding_type,
    preferred_countries: data.preferred_countries,
    open_to_all_countries: data.open_to_all_countries ?? false,
  };

  const response = await apiClient<PreferencesApi>('/profile/preferences', {
    method: 'PUT',
    headers: getProfileAuthHeaders(),
    body: JSON.stringify(payload),
  });

  // Merge: server response is authoritative, but fall back to submitted values
  // for fields the server may not echo back (prevents null overwrite).
  const normalizedResponse = normalizePreferences(response);
  return normalizePreferences({
    ...data,
    ...payload,
    ...normalizedResponse,
    target_field_of_study:
      normalizedResponse.target_field_of_study ?? payload.target_field_of_study,
    target_field_of_study_openalex_id:
      normalizedResponse.target_field_of_study_openalex_id ??
      payload.target_field_of_study_openalex_id,
    detailed_specialization:
      data.desired_degree_level === 'PHD'
        ? (normalizedResponse.detailed_specialization ?? payload.detailed_specialization)
        : null,
  });
}
