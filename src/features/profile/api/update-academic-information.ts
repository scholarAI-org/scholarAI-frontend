import { apiClient } from '@/lib/api-client';
import { getProfileAuthHeaders } from './profile-auth';
import {
  academicInformationApiSchema,
  type AcademicInformationApi,
} from '../schemas/academic-information-api.schema';

export async function updateAcademicInformation(
  data: AcademicInformationApi
): Promise<AcademicInformationApi> {
  const payload = academicInformationApiSchema.parse(data);
  const response = await apiClient<unknown>('/profile/academic-info', {
    method: 'PUT',
    headers: getProfileAuthHeaders(),
    body: JSON.stringify(payload),
  });

  // Try to parse the response to see if backend returned the saved object
  const saved = academicInformationApiSchema.safeParse(response);
  return saved.success ? saved.data : payload;
}
