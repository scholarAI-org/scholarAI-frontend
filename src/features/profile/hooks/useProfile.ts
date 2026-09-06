import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../api/get-profile';
import { profileKeys } from '../query-keys';
import { emptyFullProfile } from '../schemas/full-profile-api.schema';

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.fullProfile(),
    queryFn: ({ signal }) => getProfile(signal),
    retry: false,
    initialData: emptyFullProfile,
  });
}
