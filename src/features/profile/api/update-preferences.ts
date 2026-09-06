import { apiClient } from '@/lib/api-client';
import { getProfileAuthHeaders } from './profile-auth';
import { type PreferencesApi, normalizePreferences } from '../schemas/preferences-api.schema';

export async function updatePreferences(data: PreferencesApi): Promise<PreferencesApi> {
  const payload = {
    desired_degree_level: data.desired_degree_level,
    funding_type: data.funding_type,
    preferred_fields_of_study: data.preferred_fields_of_study,
    preferred_countries: data.preferred_countries,
  };

  const response = await apiClient<PreferencesApi>('/profile/preferences', {
    method: 'PUT',
    headers: getProfileAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return normalizePreferences(response);
}
