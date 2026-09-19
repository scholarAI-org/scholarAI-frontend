import { apiClient } from '@/lib/api-client';
import {
  personalInformationApiSchema,
  type PersonalInformation,
} from '../schemas/personal-information-api.schema';

export async function updatePersonalInformation(
  data: PersonalInformation
): Promise<PersonalInformation> {
  const payload = personalInformationApiSchema.parse(data);
  const response = await apiClient<unknown>('/profile/personal-info', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  // PUT may return the saved resource or an acknowledgement/no content.
  // The query is revalidated after saving in either case.
  const saved = personalInformationApiSchema.safeParse(response);
  return saved.success ? saved.data : payload;
}
